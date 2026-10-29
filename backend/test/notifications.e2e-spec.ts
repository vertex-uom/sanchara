import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { DomainEvents } from '../src/common/events/domain-events.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { RedisService } from '../src/common/redis/redis.service.js';
import type { AnnouncementPublished } from '../src/modules/announcements/announcement.events.js';
import { AnnouncementsService } from '../src/modules/announcements/announcements.service.js';
import { AdminsService } from '../src/modules/auth/admins/admins.service.js';
import { CompaniesService } from '../src/modules/companies/companies.service.js';
import { MailSender, type PasswordResetMail, type StaffInviteMail } from '../src/modules/messaging/mail/mail-sender.js';
import { NotificationsService } from '../src/modules/notifications/notifications.service.js';
import { StaffInvitesService } from '../src/modules/staff/staff-invites.service.js';

class CapturingMailSender extends MailSender {
  readonly invites: StaffInviteMail[] = [];
  sendPasswordReset(_mail: PasswordResetMail) {
    return Promise.resolve();
  }
  sendStaffInvite(mail: StaffInviteMail) {
    this.invites.push(mail);
    return Promise.resolve();
  }
}

const PASSWORD = 'correct horse battery';
const HOUR_MS = 60 * 60 * 1000;
const ALL_ROLES: AnnouncementPublished['recipients']['roles'] = ['OWNER', 'MANAGER', 'FRONT_DESK'];
const tokenOf = (url: string) => new URL(url).searchParams.get('token')!;

let sequence = 0;
// An announcement.published payload, as the announcements module raises it.
function published(overrides: Partial<AnnouncementPublished> = {}): AnnouncementPublished {
  sequence += 1;
  return {
    announcementId: `0190f5c2-0000-7000-8000-${String(sequence).padStart(12, '0')}`,
    title: `Announcement ${sequence}`,
    message: 'Back Office is read-only on 2 Nov between 01:00 and 03:00.',
    type: 'maintenance',
    audience: 'all-staff',
    recipients: { roles: ALL_ROLES, staffStatuses: ['ACTIVE'], companyStatuses: ['ACTIVE'] },
    dismissible: true,
    startsAt: new Date(Date.now() - HOUR_MS).toISOString(),
    endsAt: null,
    publishedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Notifications (e2e)', () => {
  let app: NestExpressApplication;
  let http: ReturnType<NestExpressApplication['getHttpServer']>;
  let prisma: PrismaService;
  let events: DomainEvents;
  const mail = new CapturingMailSender();

  const post = (path: string, body: Record<string, unknown>, token?: string) => {
    const call = request(http).post(`/v1${path}`).send(body);
    return token ? call.set('Authorization', `Bearer ${token}`) : call;
  };
  const feed = (token: string) => request(http).get('/v1/notifications').set('Authorization', `Bearer ${token}`);
  const titles = async (token: string) => ((await feed(token).expect(200)).body.items as { title: string }[]).map((item) => item.title);
  const lastInviteToken = () => tokenOf(mail.invites.at(-1)!.inviteUrl);
  const accept = (token: string, portal: 'owner' | 'staff') => post('/auth/staff/invite/accept', { token, password: PASSWORD, portal });

  // A company whose Owner has accepted the invite; returns the Owner's session token.
  async function companyWithOwner(subdomain: string) {
    const company = await app.get(CompaniesService).create({ name: `Hotel ${subdomain}`, subdomain });
    await app.get(StaffInvitesService).inviteOwner(company.id, { fullName: 'Owner', email: `owner@${subdomain}.example.com` });
    const accepted = await accept(lastInviteToken(), 'owner').expect(200);
    return { company, owner: accepted.body.session.token as string };
  }

  async function addStaff(ownerToken: string, email: string, role: 'manager' | 'front-desk') {
    await post('/staff', { fullName: 'Staff', email, role }, ownerToken).expect(201);
    return (await accept(lastInviteToken(), 'staff').expect(200)).body.session.token as string;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailSender)
      .useValue(mail)
      .compile();
    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();
    http = app.getHttpServer();
    prisma = app.get(PrismaService);
    events = app.get(DomainEvents);
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "notifications", "announcements", "companies", "platform_admins", "audit_entries", "guests" CASCADE');
    await app.get(RedisService).flushdb();
    mail.invites.length = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  it('needs a staff session', async () => {
    await request(http).get('/v1/notifications').expect(401);
    await feed('not-a-token').expect(401);
  });

  it('shows a published announcement to the staff it is addressed to, with read state and unread count', async () => {
    const { owner } = await companyWithOwner('palm');
    const manager = await addStaff(owner, 'manager@palm.example.com', 'manager');
    await events.emit('announcement.published', published({ title: 'For everyone', type: 'urgent' }));
    await events.emit('announcement.published', published({ title: 'Owners only', audience: 'owners', recipients: { ...published().recipients, roles: ['OWNER'] } }));

    const ownerFeed = (await feed(owner).expect(200)).body;
    expect(ownerFeed.unreadCount).toBe(2);
    expect(ownerFeed.items.find((item: { title: string }) => item.title === 'For everyone')).toEqual({
      id: expect.any(String),
      type: 'system',
      severity: 'critical',
      dashboard: 'backoffice',
      title: 'For everyone',
      message: expect.any(String),
      createdAt: expect.any(String),
      read: false,
      dismissible: true,
    });
    expect(await titles(manager)).toEqual(['For everyone']);
  });

  it('reaches active companies only, not suspended ones or companies still in setup', async () => {
    const active = await companyWithOwner('active');
    const suspended = await companyWithOwner('suspended');
    const pending = await companyWithOwner('pending');
    await prisma.company.update({ where: { id: suspended.company.id }, data: { status: 'SUSPENDED_NON_PAYMENT' } });
    await prisma.company.update({ where: { id: pending.company.id }, data: { status: 'PENDING_SETUP' } });
    await events.emit('announcement.published', published({ title: 'Maintenance tonight' }));

    expect(await titles(active.owner)).toEqual(['Maintenance tonight']);
    expect(await titles(pending.owner)).toEqual([]);
    expect((await feed(suspended.owner).expect(403)).body.code).toBe('COMPANY_SUSPENDED');
    // Back to active: the live announcement is there.
    await prisma.company.update({ where: { id: suspended.company.id }, data: { status: 'ACTIVE' } });
    expect(await titles(suspended.owner)).toEqual(['Maintenance tonight']);
  });

  it('read, read-all, and per-person state', async () => {
    const { owner } = await companyWithOwner('reef');
    const frontDesk = await addStaff(owner, 'desk@reef.example.com', 'front-desk');
    await events.emit('announcement.published', published({ title: 'One' }));
    await events.emit('announcement.published', published({ title: 'Two' }));

    const [first] = (await feed(owner).expect(200)).body.items as { id: string }[];
    await post(`/notifications/${first.id}/read`, {}, owner).expect(204);
    await post(`/notifications/${first.id}/read`, {}, owner).expect(204);
    expect((await feed(owner).expect(200)).body.unreadCount).toBe(1);

    await post('/notifications/read-all', {}, owner).expect(204);
    const after = (await feed(owner).expect(200)).body;
    expect(after.unreadCount).toBe(0);
    expect(after.items.every((item: { read: boolean }) => item.read)).toBe(true);
    // Someone else's state is untouched.
    expect((await feed(frontDesk).expect(200)).body.unreadCount).toBe(2);
  });

  it('dismiss hides it for that person only; non-dismissible ones refuse', async () => {
    const { owner } = await companyWithOwner('lagoon');
    const manager = await addStaff(owner, 'manager@lagoon.example.com', 'manager');
    await events.emit('announcement.published', published({ title: 'Closable' }));
    await events.emit('announcement.published', published({ title: 'Sticky', dismissible: false }));
    const items = (await feed(owner).expect(200)).body.items as { id: string; title: string }[];
    const closable = items.find((item) => item.title === 'Closable')!;
    const sticky = items.find((item) => item.title === 'Sticky')!;

    await post(`/notifications/${closable.id}/dismiss`, {}, owner).expect(204);
    expect((await post(`/notifications/${sticky.id}/dismiss`, {}, owner).expect(409)).body.code).toBe('NOT_DISMISSIBLE');
    expect(await titles(owner)).toEqual(['Sticky']);
    expect((await titles(manager)).sort()).toEqual(['Closable', 'Sticky']);
    // Gone for the owner now: acting on it again is a 404.
    await post(`/notifications/${closable.id}/read`, {}, owner).expect(404);
  });

  it('a notification addressed to other roles is a 404', async () => {
    const { owner } = await companyWithOwner('hill');
    const frontDesk = await addStaff(owner, 'desk@hill.example.com', 'front-desk');
    await events.emit('announcement.published', published({ title: 'Owners only', recipients: { ...published().recipients, roles: ['OWNER'] } }));
    const [item] = (await feed(owner).expect(200)).body.items as { id: string }[];
    await post(`/notifications/${item.id}/read`, {}, frontDesk).expect(404);
    await post('/notifications/0190f5c2-0000-7000-8000-000000000000/read', {}, owner).expect(404);
  });

  it('withdrawn or ended notifications disappear; repeated events change nothing', async () => {
    const { owner } = await companyWithOwner('bay');
    const keep = published({ title: 'Stays' });
    const withdraw = published({ title: 'Withdrawn' });
    await events.emit('announcement.published', keep);
    await events.emit('announcement.published', keep);
    await events.emit('announcement.published', withdraw);
    await events.emit('announcement.published', published({ title: 'Ended', endsAt: new Date(Date.now() - 1000).toISOString() }));
    expect((await titles(owner)).sort()).toEqual(['Stays', 'Withdrawn']);
    expect(await prisma.notification.count({ where: { sourceId: keep.announcementId } })).toBe(1);

    const withdrawn = { announcementId: withdraw.announcementId, reason: 'archived' as const, withdrawnAt: new Date().toISOString() };
    await events.emit('announcement.withdrawn', withdrawn);
    await events.emit('announcement.withdrawn', withdrawn);
    expect(await titles(owner)).toEqual(['Stays']);
  });

  it('catches up with live announcements after missed events', async () => {
    const { owner } = await companyWithOwner('fort');
    const stale = published({ title: 'No longer live' });
    await events.emit('announcement.published', stale);
    await prisma.notification.updateMany({ data: { updatedAt: new Date(Date.now() - HOUR_MS) } });

    await app.get(NotificationsService).reconcileAnnouncements([published({ title: 'Missed while down' })]);
    expect(await titles(owner)).toEqual(['Missed while down']);
  });

  it('end to end: an admin publishes and archives an announcement', async () => {
    const { owner } = await companyWithOwner('demo');
    const admin = await app.get(AdminsService).create({ fullName: 'Ruwan Perera', email: 'ruwan@sanchara.example.com' }, 'not-a-real-hash');
    const announcements = app.get(AnnouncementsService);
    const created = await announcements.create(admin, { title: 'New: arrivals board', message: 'Front Desk home shows arrivals.', type: 'feature', audience: 'all-staff', dismissible: true });

    const [item] = (await feed(owner).expect(200)).body.items as { title: string; severity: string }[];
    expect(item).toMatchObject({ title: 'New: arrivals board', severity: 'success' });

    await announcements.archive(admin, created.id);
    expect(await titles(owner)).toEqual([]);
  });
});
