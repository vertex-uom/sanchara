import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { RedisService } from '../src/common/redis/redis.service.js';
import { CompaniesService } from '../src/modules/companies/companies.service.js';
import { MailSender, type PasswordResetMail, type StaffInviteMail } from '../src/modules/messaging/mail/mail-sender.js';
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
const tokenOf = (url: string) => new URL(url).searchParams.get('token')!;

describe('Staff management (e2e)', () => {
  let app: NestExpressApplication;
  let http: ReturnType<NestExpressApplication['getHttpServer']>;
  let prisma: PrismaService;
  const mail = new CapturingMailSender();

  const auth = <T extends request.Test>(call: T, token?: string) => (token ? call.set('Authorization', `Bearer ${token}`) : call);
  const get = (path: string, token?: string) => auth(request(http).get(`/v1${path}`), token);
  const post = (path: string, body: Record<string, unknown>, token?: string) => auth(request(http).post(`/v1${path}`).send(body), token);
  const put = (path: string, body: Record<string, unknown>, token?: string) => auth(request(http).put(`/v1${path}`).send(body), token);
  const lastInvite = () => tokenOf(mail.invites.at(-1)!.inviteUrl);
  const accept = (portal: string, token = lastInvite()) => post('/auth/staff/invite/accept', { token, password: PASSWORD, portal });

  // A company (optionally on a plan) with a signed-in Owner.
  async function company(subdomain: string, planId?: number) {
    const created = await app.get(CompaniesService).create({ name: `Hotel ${subdomain}`, subdomain });
    if (planId) await prisma.subscription.create({ data: { companyId: created.id, planId, status: 'ACTIVE' } });
    await app.get(StaffInvitesService).inviteOwner(created.id, { fullName: 'Olivia Owner', email: `owner@${subdomain}.example.com` });
    const owner = (await accept('owner').expect(200)).body.session.token as string;
    return { companyId: created.id, owner };
  }

  // Invites (as `actor`) and accepts; returns the id and the new member's session.
  async function member(actor: string, email: string, role: string, fullName = 'Kasun Silva') {
    const invited = await post('/staff', { fullName, email, role }, actor).expect(201);
    const token = (await accept('staff').expect(200)).body.session.token as string;
    return { id: invited.body.staff.id as string, token };
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(MailSender).useValue(mail).compile();
    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();
    http = app.getHttpServer();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "companies", "audit_entries", "guests" CASCADE');
    await app.get(RedisService).flushdb();
    mail.invites.length = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists the company staff, Owner first, with what the signed-in user may change', async () => {
    const { owner } = await company('palm');
    const manager = await member(owner, 'manager@palm.example.com', 'manager', 'Mala Manager');
    await post('/staff', { fullName: 'Dinu Desk', email: 'desk@palm.example.com', role: 'front-desk' }, manager.token).expect(201);
    await company('lagoon');

    const asOwner = (await get('/staff', owner).expect(200)).body;
    expect(asOwner.seats).toEqual({ used: 3, limit: null });
    expect(asOwner.members.map((m: { fullName: string; role: string; status: string; manageable: boolean; you: boolean }) => [m.fullName, m.role, m.status, m.manageable, m.you])).toEqual([
      ['Olivia Owner', 'owner', 'active', false, true],
      ['Mala Manager', 'manager', 'active', true, false],
      ['Dinu Desk', 'front-desk', 'invited', true, false],
    ]);
    expect(asOwner.members[2].inviteExpiresAt).not.toBeNull();

    const asManager = (await get('/staff', manager.token).expect(200)).body;
    expect(asManager.members.map((m: { manageable: boolean }) => m.manageable)).toEqual([false, false, true]);
    expect((await get('/staff?status=invited', owner).expect(200)).body.members).toHaveLength(1);
    expect((await get('/staff?q=mala', owner).expect(200)).body.members).toHaveLength(1);
  });

  it('only Owners and Managers use it; Front Desk and others are refused', async () => {
    const { owner } = await company('palm');
    const desk = await member(owner, 'desk@palm.example.com', 'front-desk');
    expect((await get('/staff', desk.token).expect(403)).body.message).toBe('Only the Owner or a Manager can do this.');
    await post('/staff', { fullName: 'X', email: 'x@palm.example.com', role: 'front-desk' }, desk.token).expect(403);
    await get('/staff').expect(401);
  });

  it("the plan's staff limit counts active and invited accounts", async () => {
    const { owner } = await company('palm', 1); // Starter: 3
    await member(owner, 'manager@palm.example.com', 'manager');
    const desk = await member(owner, 'desk@palm.example.com', 'front-desk');
    expect((await get('/staff', owner).expect(200)).body.seats).toEqual({ used: 3, limit: 3 });

    const full = await post('/staff', { fullName: 'One More', email: 'more@palm.example.com', role: 'front-desk' }, owner).expect(409);
    expect(full.body.code).toBe('LIMIT_REACHED');

    await post(`/staff/${desk.id}/deactivate`, {}, owner).expect(200);
    await post('/staff', { fullName: 'One More', email: 'more@palm.example.com', role: 'front-desk' }, owner).expect(201);
    expect((await post(`/staff/${desk.id}/reactivate`, {}, owner).expect(409)).body.code).toBe('LIMIT_REACHED');
  });

  it('role changes: one Owner, Managers only change Front Desk, nobody changes themselves', async () => {
    const { owner } = await company('palm');
    const manager = await member(owner, 'manager@palm.example.com', 'manager');
    const desk = await member(owner, 'desk@palm.example.com', 'front-desk');
    const ownerId = (await get('/staff', owner).expect(200)).body.members[0].id;

    expect((await put(`/staff/${desk.id}/role`, { role: 'manager' }, owner).expect(200)).body.staff.role).toBe('manager');
    expect((await put(`/staff/${desk.id}/role`, { role: 'owner' }, owner).expect(400)).body.fieldErrors).toHaveProperty('role');
    expect((await put(`/staff/${ownerId}/role`, { role: 'manager' }, owner).expect(403)).body.message).toBe("You can't change your own account.");
    await put(`/staff/${ownerId}/role`, { role: 'manager' }, manager.token).expect(403);
    // desk is a Manager now: a Manager can't change another Manager, or give the Manager role.
    await put(`/staff/${desk.id}/role`, { role: 'front-desk' }, manager.token).expect(403);
    await put(`/staff/${manager.id}/role`, { role: 'front-desk' }, manager.token).expect(403);

    const audit = await prisma.auditEntry.findMany({ where: { entityId: desk.id, action: 'staff.role_changed' } });
    expect(audit.map((entry) => entry.details)).toEqual([{ name: 'Kasun Silva', from: 'front-desk', to: 'manager' }]);
  });

  it('deactivating signs the account out and stops its invite; reactivating restores it', async () => {
    const { owner } = await company('palm');
    const desk = await member(owner, 'desk@palm.example.com', 'front-desk');
    await get('/me', desk.token).expect(200);

    await post(`/staff/${desk.id}/deactivate`, {}, owner).expect(200);
    await get('/me', desk.token).expect(401);
    await post('/auth/staff/login', { email: 'desk@palm.example.com', password: PASSWORD, portal: 'staff' }).expect(401);

    expect((await post(`/staff/${desk.id}/reactivate`, {}, owner).expect(200)).body.staff.status).toBe('active');
    await post('/auth/staff/login', { email: 'desk@palm.example.com', password: PASSWORD, portal: 'staff' }).expect(200);

    // An invited account: its link stops working; reactivating sends a new one.
    const invited = (await post('/staff', { fullName: 'New Desk', email: 'new@palm.example.com', role: 'front-desk' }, owner).expect(201)).body.staff;
    const firstLink = lastInvite();
    await post(`/staff/${invited.id}/deactivate`, {}, owner).expect(200);
    await accept('staff', firstLink).expect(400);
    expect((await post(`/staff/${invited.id}/reactivate`, {}, owner).expect(200)).body.staff.status).toBe('invited');
    expect(lastInvite()).not.toBe(firstLink);
    await accept('staff').expect(200);

    const ownerId = (await get('/staff', owner).expect(200)).body.members[0].id;
    expect((await post(`/staff/${ownerId}/deactivate`, {}, owner).expect(403)).body.message).toBe("You can't change your own account.");
  });

  it('resends an invite to an account that has not accepted yet', async () => {
    const { owner } = await company('palm');
    const invited = (await post('/staff', { fullName: 'New Desk', email: 'new@palm.example.com', role: 'front-desk' }, owner).expect(201)).body.staff;
    const firstLink = lastInvite();
    await post(`/staff/${invited.id}/invite`, {}, owner).expect(200);
    expect(lastInvite()).not.toBe(firstLink);
    await accept('staff', firstLink).expect(400);
    await accept('staff').expect(200);
    expect((await post(`/staff/${invited.id}/invite`, {}, owner).expect(409)).body.code).toBe('NOT_INVITED');
  });

  it("another company's staff read as not found", async () => {
    const { owner } = await company('palm');
    const { owner: other } = await company('lagoon');
    const theirs = await member(other, 'desk@lagoon.example.com', 'front-desk');
    await post(`/staff/${theirs.id}/deactivate`, {}, owner).expect(404);
    await put(`/staff/${theirs.id}/role`, { role: 'manager' }, owner).expect(404);
  });
});
