import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { DomainEvents } from '../src/common/events/domain-events.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { RedisService } from '../src/common/redis/redis.service.js';
import type { AnnouncementPublished, AnnouncementWithdrawn } from '../src/modules/announcements/announcement.events.js';
import { AnnouncementsPublisher } from '../src/modules/announcements/announcements.publisher.js';
import { AnnouncementsService } from '../src/modules/announcements/announcements.service.js';
import { AdminsService } from '../src/modules/auth/admins/admins.service.js';
import { PasswordService } from '../src/modules/auth/services/password.service.js';

const ADMIN_EMAIL = 'ruwan@sanchara.example.com';
const PASSWORD = 'correct horse battery';
const HOUR_MS = 60 * 60 * 1000;
const inHours = (hours: number) => new Date(Date.now() + hours * HOUR_MS).toISOString();

const announcement = (overrides: Record<string, unknown> = {}) => ({
  title: 'Maintenance: database upgrade',
  message: 'Back Office is read-only on 2 Nov between 01:00 and 03:00.',
  type: 'maintenance',
  audience: 'all-staff',
  dismissible: false,
  ...overrides,
});

describe('Announcements (e2e)', () => {
  let app: NestExpressApplication;
  let http: ReturnType<NestExpressApplication['getHttpServer']>;
  let prisma: PrismaService;
  let adminToken: string;
  const published: AnnouncementPublished[] = [];
  const withdrawn: AnnouncementWithdrawn[] = [];

  const call = (method: 'get' | 'post' | 'put', path: string, body?: Record<string, unknown>, token = adminToken) => {
    const req = request(http)[method](`/v1/admin/announcements${path}`).set('Authorization', `Bearer ${token}`);
    return body ? req.send(body) : req;
  };
  // Moves an announcement's window into the past, as if time had passed.
  const shift = (id: string, data: { startsAt?: Date; endsAt?: Date | null }) => prisma.announcement.update({ where: { id }, data });
  const runPublisher = () => app.get(AnnouncementsPublisher).run();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();
    http = app.getHttpServer();
    prisma = app.get(PrismaService);
    // Stands in for the notifications module.
    const events = app.get(DomainEvents);
    events.on('announcement.published', (event) => void published.push(event));
    events.on('announcement.withdrawn', (event) => void withdrawn.push(event));
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "announcements", "platform_admins", "audit_entries" CASCADE');
    await app.get(RedisService).flushdb();
    published.length = 0;
    withdrawn.length = 0;
    vi.restoreAllMocks();
    const hash = await app.get(PasswordService).hash(PASSWORD);
    await app.get(AdminsService).create({ fullName: 'Ruwan Perera', email: ADMIN_EMAIL }, hash);
    adminToken = (await request(http).post('/v1/auth/admin/login').send({ email: ADMIN_EMAIL, password: PASSWORD }).expect(200)).body.session.token as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it('needs an admin session', async () => {
    await request(http).get('/v1/admin/announcements?status=active').expect(401);
    await call('get', '?status=active', undefined, 'not-a-token').expect(401);
  });

  it('publishing now stores it, raises announcement.published at once and audits it', async () => {
    const { body } = await call('post', '', announcement()).expect(201);
    expect(body).toMatchObject({ status: 'active', type: 'maintenance', audience: 'all-staff', dismissible: false, endsAt: null, createdBy: { fullName: 'Ruwan Perera' } });
    expect(body.publishedAt).toEqual(expect.any(String));

    expect(published).toEqual([
      expect.objectContaining({
        announcementId: body.id,
        title: 'Maintenance: database upgrade',
        type: 'maintenance',
        audience: 'all-staff',
        recipients: { roles: ['OWNER', 'MANAGER', 'FRONT_DESK'], staffStatuses: ['ACTIVE'], companyStatuses: ['ACTIVE', 'SUSPENDED_NON_PAYMENT', 'SUSPENDED_BY_ADMIN'] },
        dismissible: false,
        endsAt: null,
      }),
    ]);
    const actions = (await prisma.auditEntry.findMany({ where: { entityId: body.id }, orderBy: { occurredAt: 'asc' } })).map((entry) => [entry.actorType, entry.action]);
    expect(actions).toEqual([
      ['PLATFORM_ADMIN', 'announcement.created'],
      ['SYSTEM', 'announcement.published'],
    ]);
  });

  it('a scheduled announcement is published when its start arrives, exactly once', async () => {
    const { body } = await call('post', '', announcement({ audience: 'owners', startsAt: inHours(2), endsAt: inHours(5) })).expect(201);
    expect(body).toMatchObject({ status: 'scheduled', publishedAt: null });
    await runPublisher();
    expect(published).toHaveLength(0);

    await shift(body.id, { startsAt: new Date(Date.now() - 1000) });
    await Promise.all([runPublisher(), runPublisher()]);
    expect(published).toEqual([expect.objectContaining({ announcementId: body.id, audience: 'owners', recipients: expect.objectContaining({ roles: ['OWNER'] }) })]);
  });

  it('withdraws it when its end passes, and when an admin archives it', async () => {
    const ending = (await call('post', '', announcement({ endsAt: inHours(1) })).expect(201)).body;
    const archiving = (await call('post', '', announcement({ title: 'Second' })).expect(201)).body;

    await shift(ending.id, { startsAt: new Date(Date.now() - 2 * HOUR_MS), endsAt: new Date(Date.now() - 1000) });
    await runPublisher();
    const archived = await call('post', `/${archiving.id}/archive`).expect(200);
    expect(archived.body).toMatchObject({ status: 'archived', archivedBy: { fullName: 'Ruwan Perera' } });
    expect(archived.body.withdrawnAt).toEqual(expect.any(String));

    expect(withdrawn).toEqual([
      expect.objectContaining({ announcementId: ending.id, reason: 'ended' }),
      expect.objectContaining({ announcementId: archiving.id, reason: 'archived' }),
    ]);
    // Archiving again changes nothing.
    await call('post', `/${archiving.id}/archive`).expect(200);
    expect(withdrawn).toHaveLength(2);
  });

  it('cancelling a scheduled announcement never publishes it', async () => {
    const { body } = await call('post', '', announcement({ startsAt: inHours(3) })).expect(201);
    expect((await call('post', `/${body.id}/archive`).expect(200)).body).toMatchObject({ status: 'archived', publishedAt: null });
    await shift(body.id, { startsAt: new Date(Date.now() - 1000) });
    await runPublisher();
    expect(published).toHaveLength(0);
    expect(withdrawn).toHaveLength(0);
    expect(await prisma.auditEntry.count({ where: { entityId: body.id, action: 'announcement.cancelled' } })).toBe(1);
  });

  it('a scheduled announcement can be edited; a live or archived one cannot', async () => {
    const scheduled = (await call('post', '', announcement({ startsAt: inHours(4) })).expect(201)).body;
    const edited = await call('put', `/${scheduled.id}`, announcement({ title: 'Edited', audience: 'managers', startsAt: inHours(6) })).expect(200);
    expect(edited.body).toMatchObject({ title: 'Edited', audience: 'managers', status: 'scheduled' });

    const liveOne = (await call('post', '', announcement()).expect(201)).body;
    expect((await call('put', `/${liveOne.id}`, announcement({ title: 'Too late' })).expect(409)).body.code).toBe('ANNOUNCEMENT_LIVE');

    await call('post', `/${scheduled.id}/archive`).expect(200);
    expect((await call('put', `/${scheduled.id}`, announcement({ startsAt: inHours(6) })).expect(409)).body.code).toBe('ANNOUNCEMENT_ARCHIVED');
  });

  it('a failing listener is retried on the next pass', async () => {
    const events = app.get(DomainEvents);
    let fail = true;
    const off = events.on('announcement.published', () => {
      if (fail) throw new Error('notifications down');
    });
    try {
      const { body } = await call('post', '', announcement()).expect(201);
      expect(body.publishedAt).toBeNull();
      fail = false;
      await runPublisher();
      expect((await call('get', `/${body.id}`).expect(200)).body.publishedAt).toEqual(expect.any(String));
    } finally {
      off();
    }
  });

  it('lists by status with counts, and serves live announcements to the notifications module', async () => {
    await call('post', '', announcement({ title: 'Live A' })).expect(201);
    await call('post', '', announcement({ title: 'Later', startsAt: inHours(10) })).expect(201);
    const gone = (await call('post', '', announcement({ title: 'Gone' })).expect(201)).body;
    await call('post', `/${gone.id}/archive`).expect(200);

    expect((await call('get', '/summary').expect(200)).body).toEqual({ active: 1, scheduled: 1, archived: 1 });
    const active = (await call('get', '?status=active').expect(200)).body;
    expect(active).toMatchObject({ total: 1, page: 1, pageSize: 8, items: [expect.objectContaining({ title: 'Live A' })] });
    expect((await call('get', '?status=archived').expect(200)).body.items.map((a: { title: string }) => a.title)).toEqual(['Gone']);
    expect((await app.get(AnnouncementsService).liveAnnouncements()).map((a) => a.title)).toEqual(['Live A']);
  });

  it('rejects bad input with field errors', async () => {
    const response = await call('post', '', {
      title: ' ',
      message: 'x'.repeat(401),
      type: 'party',
      audience: 'guests',
      dismissible: 'yes',
      startsAt: '2026-11-02T01:00',
    }).expect(400);
    expect(Object.keys(response.body.fieldErrors).sort()).toEqual(['audience', 'dismissible', 'message', 'startsAt', 'title', 'type']);

    const past = await call('post', '', announcement({ startsAt: inHours(-2) })).expect(400);
    expect(past.body.fieldErrors).toEqual({ startsAt: [expect.stringContaining('past')] });
    const backwards = await call('post', '', announcement({ startsAt: inHours(3), endsAt: inHours(2) })).expect(400);
    expect(backwards.body.fieldErrors).toEqual({ endsAt: ['The end must be after the start.'] });
    await call('post', '', { ...announcement(), channels: ['email'] }).expect(400);
    await call('get', '/0190f5c2-0000-7000-8000-000000000000').expect(404);
  });
});
