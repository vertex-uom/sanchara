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
const tokenOf = (url: string) => new URL(url).searchParams.get('token')!;

describe('Accounts and company enforcement (e2e)', () => {
  let app: NestExpressApplication;
  let http: ReturnType<NestExpressApplication['getHttpServer']>;
  let prisma: PrismaService;
  let adminToken: string;
  const mail = new CapturingMailSender();

  const auth = <T extends request.Test>(call: T, token?: string) => (token ? call.set('Authorization', `Bearer ${token}`) : call);
  const get = (path: string, token?: string) => auth(request(http).get(`/v1${path}`), token);
  const post = (path: string, body: Record<string, unknown>, token?: string) => auth(request(http).post(`/v1${path}`).send(body), token);
  const accept = (portal: string) => post('/auth/staff/invite/accept', { token: tokenOf(mail.invites.at(-1)!.inviteUrl), password: PASSWORD, portal });

  // An active company on the Standard plan, with a property, a signed-in Owner and Manager.
  async function company(subdomain: string, town = 'Galle') {
    const created = await app.get(CompaniesService).create({ name: `Hotel ${subdomain}`, subdomain, town, status: 'PENDING_SETUP' });
    await prisma.subscription.create({ data: { companyId: created.id, planId: 2, status: 'ACTIVE' } });
    const galle = await prisma.district.findUniqueOrThrow({ where: { name: 'Galle' } });
    const property = await app.get(PropertiesService).create({
      companyId: created.id,
      propertyTypeId: 1,
      name: `${subdomain} House`,
      address: { line1: '1 Main Street', line2: null, city: town, districtId: galle.id, postalCode: null },
    });
    await app.get(StaffInvitesService).inviteOwner(created.id, { fullName: 'Olivia Owner', email: `owner@${subdomain}.example.com` });
    const owner = (await accept('owner').expect(200)).body.session.token as string;
    await post('/staff', { fullName: 'Mala Manager', email: `manager@${subdomain}.example.com`, role: 'manager' }, owner).expect(201);
    const manager = (await accept('staff').expect(200)).body.session.token as string;
    return { companyId: created.id, propertyId: property.id, owner, manager };
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
    await app.get(AdminsService).create({ fullName: 'Kamala Silva', email: 'kamala@sanchara.example.com' }, hash);
    adminToken = (await post('/auth/admin/login', { email: 'kamala@sanchara.example.com', password: PASSWORD }).expect(200)).body.session.token as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists companies with filters, a summary and filter options', async () => {
    const palm = await company('palm');
    await company('lagoon', 'Bentota');
    await app.get(CompaniesService).create({ name: 'Hill Lodge', subdomain: 'hill', town: 'Ella', status: 'PENDING_SETUP' });

    const list = (await get('/admin/companies', adminToken).expect(200)).body;
    expect(list).toMatchObject({ total: 3, page: 1, pageSize: 8 });
    expect(list.items.map((c: { name: string }) => c.name)).toEqual(['Hill Lodge', 'Hotel lagoon', 'Hotel palm']);
    expect(list.items.find((c: { id: string }) => c.id === palm.companyId)).toMatchObject({
      location: 'Galle',
      plan: { code: 'STANDARD', name: 'Standard' },
      propertyCount: 1,
      staffCount: 2,
      status: 'active',
    });
    expect((await get('/admin/companies?status=pending-setup', adminToken).expect(200)).body.total).toBe(1);
    expect((await get('/admin/companies?town=Bentota', adminToken).expect(200)).body.items[0].name).toBe('Hotel lagoon');
    expect((await get('/admin/companies?q=palm&sort=name', adminToken).expect(200)).body.total).toBe(1);
    expect((await get('/admin/companies?plan=PRO', adminToken).expect(200)).body.total).toBe(0);

    expect((await get('/admin/companies/summary', adminToken).expect(200)).body).toEqual({
      total: 3,
      active: 2,
      pendingSetup: 1,
      suspendedByAdmin: 0,
      suspendedNonPayment: 0,
      joinedLast30Days: 3,
    });
    expect((await get('/admin/companies/options', adminToken).expect(200)).body.towns).toEqual(['Bentota', 'Ella', 'Galle']);
    await get('/admin/companies').expect(401);
    await get('/admin/companies', palm.owner).expect(401);
  });

  it('suspending refuses the company staff everywhere; reactivating restores access', async () => {
    const palm = await company('palm');
    const { owner, manager, propertyId, companyId } = palm;

    const suspended = await post(`/admin/companies/${companyId}/suspend`, { reason: 'Policy violation · misleading photos' }, adminToken).expect(200);
    expect(suspended.body.company.status).toBe('suspended-by-admin');

    for (const token of [owner, manager]) {
      const refused = await get('/properties', token).expect(403);
      expect(refused.body.code).toBe('COMPANY_SUSPENDED');
      await get('/staff', token).expect(403);
      await get('/website/assistance-request', token).expect(403);
    }
    await get(`/properties/${propertyId}/settings`, owner).expect(403);
    // /v1/me still answers, so the Back Office can show the right notice.
    expect((await get('/me', manager).expect(200)).body.company.status).toBe('suspended-by-admin');

    expect((await post(`/admin/companies/${companyId}/suspend`, { reason: 'Again' }, adminToken).expect(409)).body.code).toBe('INVALID_STATUS');
    await post(`/admin/companies/${companyId}/reactivate`, { reason: 'Issue resolved · photos replaced' }, adminToken).expect(200);
    await get('/properties', owner).expect(200);
    expect((await post(`/admin/companies/${companyId}/reactivate`, { reason: 'Again' }, adminToken).expect(409)).body.code).toBe('INVALID_STATUS');
    await post(`/admin/companies/${companyId}/suspend`, { reason: '' }, adminToken).expect(400);

    const detail = (await get(`/admin/companies/${companyId}`, adminToken).expect(200)).body.company;
    expect(detail).toMatchObject({
      status: 'active',
      owner: { name: 'Olivia Owner', email: 'owner@palm.example.com', status: 'active' },
      subscription: { status: 'active', planName: 'Standard' },
      properties: [{ name: 'palm House', city: 'Galle', status: 'active' }],
      staff: { owners: 1, managers: 1, frontDesk: 0 },
      siteHosts: ['palm.sanchara.localhost'],
      websiteRequestId: null,
    });
    expect(detail.history.map((e: { kind: string; actor: string; reason: string }) => [e.kind, e.actor, e.reason])).toEqual([
      ['reactivated', 'Kamala Silva', 'Issue resolved · photos replaced'],
      ['suspended', 'Kamala Silva', 'Policy violation · misleading photos'],
    ]);

    const log = (await get('/admin/enforcement', adminToken).expect(200)).body;
    expect(log).toMatchObject({ total: 2, page: 1 });
    expect(log.items[0]).toMatchObject({ companyId, companyName: 'Hotel palm', kind: 'reactivated' });

    const audit = await prisma.auditEntry.findMany({ where: { entityId: companyId, action: { startsWith: 'company.' } }, orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }] });
    expect(audit.map((entry) => entry.action)).toEqual(['company.owner_invite_accepted', 'company.suspended', 'company.reactivated']);
  });

  it('a pending company cannot be suspended; unknown companies are 404', async () => {
    const pending = await app.get(CompaniesService).create({ name: 'Hill Lodge', subdomain: 'hill', status: 'PENDING_SETUP' });
    await post(`/admin/companies/${pending.id}/suspend`, { reason: 'Test reason' }, adminToken).expect(409);
    await get('/admin/companies/0190f5c2-0000-7000-8000-000000000000', adminToken).expect(404);
    await post('/admin/companies/0190f5c2-0000-7000-8000-000000000000/suspend', { reason: 'Test reason' }, adminToken).expect(404);
  });
});
