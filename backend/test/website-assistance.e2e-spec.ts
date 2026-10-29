import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { RedisService } from '../src/common/redis/redis.service.js';
import { AdminsService } from '../src/modules/auth/admins/admins.service.js';
import { PasswordService } from '../src/modules/auth/services/password.service.js';
import { CompaniesService } from '../src/modules/companies/companies.service.js';
import { MailSender, type PasswordResetMail, type StaffInviteMail } from '../src/modules/messaging/mail/mail-sender.js';
import { PropertiesService } from '../src/modules/properties/properties.service.js';
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
const DAY_MS = 24 * 60 * 60 * 1000;
const tokenOf = (url: string) => new URL(url).searchParams.get('token')!;

const REQUEST = {
  contactName: 'Olivia Perera',
  phone: '+94 77 123 4567',
  email: ' Olivia@Palm.Example.com ',
  contactMethod: 'whatsapp',
  goals: ['direct-bookings', 'rooms-prices'],
  style: 'coastal',
  timing: 'one-week',
  notes: 'Six rooms near the beach.',
};

describe('Website assistance (e2e)', () => {
  let app: NestExpressApplication;
  let http: ReturnType<NestExpressApplication['getHttpServer']>;
  let prisma: PrismaService;
  let adminToken: string;
  let adminId: string;
  const mail = new CapturingMailSender();

  const auth = <T extends request.Test>(call: T, token?: string) => (token ? call.set('Authorization', `Bearer ${token}`) : call);
  const get = (path: string, token?: string) => auth(request(http).get(`/v1${path}`), token);
  const post = (path: string, body: Record<string, unknown>, token?: string) => auth(request(http).post(`/v1${path}`).send(body), token);
  const put = (path: string, body: Record<string, unknown>, token?: string) => auth(request(http).put(`/v1${path}`).send(body), token);
  const accept = (portal: string) => post('/auth/staff/invite/accept', { token: tokenOf(mail.invites.at(-1)!.inviteUrl), password: PASSWORD, portal });

  // A company with a property and a signed-in Owner; returns the Owner's token.
  async function company(subdomain: string) {
    const created = await app.get(CompaniesService).create({ name: `Hotel ${subdomain}`, subdomain });
    const galle = await prisma.district.findUniqueOrThrow({ where: { name: 'Galle' } });
    await app.get(PropertiesService).create({
      companyId: created.id,
      propertyTypeId: 1,
      name: `${subdomain} House`,
      address: { line1: '1 Main Street', line2: null, city: 'Unawatuna', districtId: galle.id, postalCode: null },
    });
    await app.get(StaffInvitesService).inviteOwner(created.id, { fullName: 'Olivia Perera', email: `owner@${subdomain}.example.com` });
    const owner = (await accept('owner').expect(200)).body.session.token as string;
    return { companyId: created.id, owner };
  }

  async function staff(ownerToken: string, email: string, role: string) {
    await post('/staff', { fullName: 'Kasun Silva', email, role }, ownerToken).expect(201);
    return (await accept('staff').expect(200)).body.session.token as string;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(MailSender).useValue(mail).compile();
    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();
    http = app.getHttpServer();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "companies", "platform_admins", "audit_entries", "guests" CASCADE');
    await app.get(RedisService).flushdb();
    mail.invites.length = 0;
    const hash = await app.get(PasswordService).hash(PASSWORD);
    adminId = (await app.get(AdminsService).create({ fullName: 'Kamala Silva', email: 'kamala@sanchara.example.com' }, hash)).id;
    adminToken = (await post('/auth/admin/login', { email: 'kamala@sanchara.example.com', password: PASSWORD }).expect(200)).body.session.token as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it('the Owner sends a request; it is the open one until changed or cancelled', async () => {
    const { owner } = await company('palm');
    expect((await get('/website/assistance-request', owner).expect(200)).body).toEqual({ request: null });

    const sent = await post('/website/assistance-request', REQUEST, owner).expect(201);
    expect(sent.body.request).toMatchObject({
      status: 'requested',
      contactName: 'Olivia Perera',
      email: 'olivia@palm.example.com',
      contactMethod: 'whatsapp',
      goals: ['direct-bookings', 'rooms-prices'],
      style: 'coastal',
      timing: 'one-week',
      notes: 'Six rooms near the beach.',
      propertyName: 'palm House',
    });
    expect(sent.body.request.reference).toMatch(/^WMX-\d{5}$/);
    expect((await get('/website/assistance-request', owner).expect(200)).body.request.id).toBe(sent.body.request.id);

    const again = await post('/website/assistance-request', REQUEST, owner).expect(409);
    expect(again.body.code).toBe('REQUEST_OPEN');

    const row = await prisma.websiteAssistanceRequest.findUniqueOrThrow({ where: { id: sent.body.request.id } });
    expect(row.dueAt!.getTime() - row.createdAt.getTime()).toBe(7 * DAY_MS);
  });

  it('changes are saved and audited; an unchanged save records nothing', async () => {
    const { owner } = await company('palm');
    const { request: sent } = (await post('/website/assistance-request', REQUEST, owner).expect(201)).body;

    const changed = await put('/website/assistance-request', { ...REQUEST, goals: ['guest-reviews'], timing: 'no-rush' }, owner).expect(200);
    expect(changed.body.request).toMatchObject({ id: sent.id, reference: sent.reference, goals: ['guest-reviews'], timing: 'no-rush' });
    await put('/website/assistance-request', { ...REQUEST, goals: ['guest-reviews'], timing: 'no-rush' }, owner).expect(200);

    const row = await prisma.websiteAssistanceRequest.findUniqueOrThrow({ where: { id: sent.id } });
    expect(row.dueAt).toBeNull();
    const audit = await prisma.auditEntry.findMany({ where: { entityId: sent.id }, orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }] });
    expect(audit.map((entry) => [entry.action, entry.details])).toEqual([
      ['website_request.requested', { reference: sent.reference }],
      ['website_request.updated', { fields: ['goals', 'timing'] }],
    ]);
  });

  it('cancelling frees the slot for a new request', async () => {
    const { owner } = await company('palm');
    expect((await post('/website/assistance-request/cancel', {}, owner).expect(404)).body.code).toBe('NO_OPEN_REQUEST');
    expect((await put('/website/assistance-request', REQUEST, owner).expect(404)).body.code).toBe('NO_OPEN_REQUEST');

    const first = (await post('/website/assistance-request', REQUEST, owner).expect(201)).body.request;
    await post('/website/assistance-request/cancel', {}, owner).expect(204);
    expect((await get('/website/assistance-request', owner).expect(200)).body.request).toBeNull();
    const second = (await post('/website/assistance-request', REQUEST, owner).expect(201)).body.request;
    expect(second.id).not.toBe(first.id);
    expect(await prisma.websiteAssistanceRequest.findUniqueOrThrow({ where: { id: first.id } })).toMatchObject({ status: 'CANCELLED' });
  });

  it('Owner and Manager may use it; Front Desk, guests of no session and admins may not', async () => {
    const { owner } = await company('palm');
    const manager = await staff(owner, 'manager@palm.example.com', 'manager');
    const desk = await staff(owner, 'desk@palm.example.com', 'front-desk');

    await post('/website/assistance-request', REQUEST, manager).expect(201);
    expect((await get('/website/assistance-request', owner).expect(200)).body.request.status).toBe('requested');
    await put('/website/assistance-request', { ...REQUEST, style: 'modern' }, owner).expect(200);

    const refused = await get('/website/assistance-request', desk).expect(403);
    expect(refused.body).toEqual({ status: 403, code: 'FORBIDDEN', message: 'Only the Owner or a Manager can do this.' });
    await post('/website/assistance-request/cancel', {}, desk).expect(403);
    await get('/website/assistance-request').expect(401);
    await get('/website/assistance-request', adminToken).expect(401);
    await get('/admin/website-requests', owner).expect(401);
  });

  it('each company sees only its own request', async () => {
    const { owner } = await company('palm');
    const { owner: other } = await company('lagoon');
    await post('/website/assistance-request', REQUEST, owner).expect(201);
    expect((await get('/website/assistance-request', other).expect(200)).body.request).toBeNull();
    await post('/website/assistance-request', REQUEST, other).expect(201);
  });

  it('refuses bad input with field errors', async () => {
    const { owner } = await company('palm');
    const bad = await post(
      '/website/assistance-request',
      { ...REQUEST, contactName: ' ', phone: 'call me', email: 'nope', contactMethod: 'pigeon', goals: ['helipad'], style: 'gothic', timing: 'yesterday', notes: 'x'.repeat(601) },
      owner,
    ).expect(400);
    expect(Object.keys(bad.body.fieldErrors).sort()).toEqual(['contactMethod', 'contactName', 'email', 'goals', 'notes', 'phone', 'style', 'timing']);
    await post('/website/assistance-request', { ...REQUEST, files: ['logo.png'] }, owner).expect(400);
    expect(await prisma.websiteAssistanceRequest.count()).toBe(0);
  });

  it('the platform team lists, filters, assigns, moves and notes requests', async () => {
    const { owner, companyId } = await company('palm');
    const { owner: other } = await company('lagoon');
    const palm = (await post('/website/assistance-request', REQUEST, owner).expect(201)).body.request;
    await post('/website/assistance-request', { ...REQUEST, contactName: 'Nimal Fernando', timing: 'no-rush' }, other).expect(201);

    const list = await get('/admin/website-requests', adminToken).expect(200);
    expect(list.body).toMatchObject({ total: 2, counts: { requested: 2, 'in-progress': 0, review: 0 }, assignees: [] });
    // Soonest due first; "no rush" last.
    expect(list.body.items.map((item: { companyName: string }) => item.companyName)).toEqual(['Hotel palm', 'Hotel lagoon']);
    expect(list.body.items[0]).toMatchObject({ id: palm.id, reference: palm.reference, companyId, location: 'Unawatuna', status: 'requested', timing: 'one-week', assignee: null });
    expect((await get('/admin/website-requests?q=nimal', adminToken).expect(200)).body.items).toHaveLength(1);
    expect((await get(`/admin/website-requests?q=${palm.reference}`, adminToken).expect(200)).body.items[0].id).toBe(palm.id);

    const assigned = await put(`/admin/website-requests/${palm.id}/assignee`, { adminId }, adminToken).expect(200);
    expect(assigned.body.request.assignee).toEqual({ id: adminId, name: 'Kamala Silva' });
    expect((await get('/admin/website-requests?assignee=unassigned', adminToken).expect(200)).body.items).toHaveLength(1);
    expect((await get(`/admin/website-requests?assignee=${adminId}`, adminToken).expect(200)).body.items[0].id).toBe(palm.id);
    await put(`/admin/website-requests/${palm.id}/assignee`, { adminId: '0190f5c2-0000-7000-8000-000000000000' }, adminToken).expect(400);

    await put(`/admin/website-requests/${palm.id}/status`, { status: 'in-progress' }, adminToken).expect(200);
    await post(`/admin/website-requests/${palm.id}/notes`, { text: 'Owner sent photos on WhatsApp.' }, adminToken).expect(201);
    await put(`/admin/website-requests/${palm.id}/status`, { status: 'review', note: 'Preview link sent' }, adminToken).expect(200);
    expect((await get('/admin/website-requests?status=review', adminToken).expect(200)).body.items).toHaveLength(1);

    const detail = (await get(`/admin/website-requests/${palm.id}`, adminToken).expect(200)).body.request;
    expect(detail).toMatchObject({
      status: 'review',
      contact: { name: 'Olivia Perera', phone: '+94 77 123 4567', email: 'olivia@palm.example.com', method: 'whatsapp' },
      requestedBy: { name: 'Olivia Perera', role: 'owner' },
      property: { name: 'palm House' },
      goals: ['direct-bookings', 'rooms-prices'],
      notes: 'Six rooms near the beach.',
      closedAt: null,
      team: [{ id: adminId, name: 'Kamala Silva' }],
    });
    expect(detail.internalNotes).toEqual([expect.objectContaining({ author: 'Kamala Silva', text: 'Owner sent photos on WhatsApp.' })]);
    expect(detail.timeline.map((event: { kind: string; actor: string; status: string | null; note: string | null }) => [event.kind, event.actor, event.status, event.note])).toEqual([
      ['status-changed', 'Kamala Silva', 'review', 'Preview link sent'],
      ['status-changed', 'Kamala Silva', 'in-progress', null],
      ['assigned', 'Kamala Silva', null, 'Assigned to Kamala Silva'],
      ['requested', 'Olivia Perera', null, palm.reference],
    ]);

    // The company never sees internal notes or the team's assignee.
    const ownerView = (await get('/website/assistance-request', owner).expect(200)).body.request;
    expect(ownerView.status).toBe('review');
    expect(JSON.stringify(ownerView)).not.toContain('WhatsApp.');
    expect(ownerView).not.toHaveProperty('assignee');

    // Publishing closes it: gone from the queue and the Back Office; no more changes.
    const published = await put(`/admin/website-requests/${palm.id}/status`, { status: 'published' }, adminToken).expect(200);
    expect(published.body.request.closedAt).not.toBeNull();
    expect((await get('/admin/website-requests', adminToken).expect(200)).body.total).toBe(1);
    expect((await get('/website/assistance-request', owner).expect(200)).body.request).toBeNull();
    expect((await put(`/admin/website-requests/${palm.id}/status`, { status: 'review' }, adminToken).expect(409)).body.code).toBe('REQUEST_CLOSED');
    await put(`/admin/website-requests/${palm.id}/assignee`, { adminId: null }, adminToken).expect(409);
    await put(`/admin/website-requests/${palm.id}/status`, { status: 'cancelled' }, adminToken).expect(400);
    await get('/admin/website-requests/0190f5c2-0000-7000-8000-000000000000', adminToken).expect(404);
  });
});
