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
import { StaffInvitesService } from '../src/modules/staff/staff-invites.service.js';
import { StaffService } from '../src/modules/staff/staff.service.js';

// Captures mails instead of logging them.
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

const ADMIN_EMAIL = 'kamala@sanchara.example.com';
const PASSWORD = 'correct horse battery';
const tokenOf = (url: string) => new URL(url).searchParams.get('token')!;

// A complete, valid create-company request; override parts per test.
function companyRequest(overrides: { company?: object; property?: object; owner?: object } = {}) {
  return {
    company: { name: 'Outlaw Grand', subdomain: 'outlaw-grand', town: 'Ella', planCode: 'standard', ...overrides.company },
    property: {
      name: 'Outlaw Grand Villa',
      typeCode: 'VILLA',
      address: { line1: 'Ella–Passara Road', city: 'Ella', districtId: 22, postalCode: '90090' },
      ...overrides.property,
    },
    owner: { fullName: 'Pasindu Bandara', email: ' Owner@Outlaw.example.com ', phone: '+94 78 715 0428', ...overrides.owner },
  };
}

describe('Company onboarding (e2e)', () => {
  let app: NestExpressApplication;
  let http: ReturnType<NestExpressApplication['getHttpServer']>;
  let prisma: PrismaService;
  let adminToken: string;
  const mail = new CapturingMailSender();

  const get = (path: string, token?: string) => {
    const call = request(http).get(`/v1${path}`);
    return token ? call.set('Authorization', `Bearer ${token}`) : call;
  };
  const post = (path: string, body: Record<string, unknown>, token?: string) => {
    const call = request(http).post(`/v1${path}`).send(body);
    return token ? call.set('Authorization', `Bearer ${token}`) : call;
  };
  const adminLogin = (email = ADMIN_EMAIL, password = PASSWORD) => post('/auth/admin/login', { email, password });
  const createCompany = (body: Record<string, unknown> = companyRequest(), token = adminToken) => post('/admin/companies', body, token);
  const companyCount = () => prisma.company.count();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailSender)
      .useValue(mail)
      .compile();
    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();
    http = app.getHttpServer();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "companies", "platform_admins", "audit_entries", "guests" CASCADE');
    await app.get(RedisService).flushdb();
    mail.invites.length = 0;
    vi.restoreAllMocks();

    const hash = await app.get(PasswordService).hash(PASSWORD);
    await app.get(AdminsService).create({ fullName: 'Kamala Silva', email: ADMIN_EMAIL }, hash);
    adminToken = (await adminLogin().expect(200)).body.session.token as string;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('admin sign-in', () => {
    it('login → /me → logout → /me is 401', async () => {
      const response = await adminLogin(' KAMALA@sanchara.example.com ').expect(200);
      expect(response.body).toMatchObject({ admin: { fullName: 'Kamala Silva', email: ADMIN_EMAIL } });
      const { token } = response.body.session;

      expect((await get('/me', token).expect(200)).body).toMatchObject({ audience: 'admin', admin: { email: ADMIN_EMAIL } });
      await post('/auth/admin/logout', {}, token).expect(204);
      await get('/me', token).expect(401);
    });

    it('rejects a wrong password with the generic 401', async () => {
      const response = await adminLogin(ADMIN_EMAIL, 'wrong password!').expect(401);
      expect(response.body).toEqual({ status: 401, code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' });
    });

    it('locks the email after 5 failures', async () => {
      for (let i = 0; i < 5; i++) await adminLogin(ADMIN_EMAIL, 'wrong password!').expect(401);
      const locked = await adminLogin().expect(429);
      expect(locked.body.code).toBe('TOO_MANY_ATTEMPTS');
    });

    it('admin routes need an admin session', async () => {
      await get('/admin/onboarding/options').expect(401);

      // A staff session is not an admin session.
      const company = await app.get(CompaniesService).create({ name: 'Palm Villa', subdomain: 'palm' });
      await app.get(StaffInvitesService).inviteOwner(company.id, { fullName: 'Owner', email: 'owner@palm.example.com' });
      const staff = await post('/auth/staff/invite/accept', { token: tokenOf(mail.invites.at(-1)!.inviteUrl), password: PASSWORD });
      await get('/admin/onboarding/options', staff.body.session.token).expect(401);
      await createCompany(companyRequest(), staff.body.session.token).expect(401);
    });
  });

  it('options list plans, property types and all 25 districts', async () => {
    const { body } = await get('/admin/onboarding/options', adminToken).expect(200);
    expect(body.platformDomain).toBe(process.env['PLATFORM_DOMAIN']);
    expect(body.reservedSubdomains).toEqual(expect.arrayContaining(['admin', 'backoffice', 'api', 'www']));
    expect(body.plans.map((plan: { code: string }) => plan.code)).toEqual(['STARTER', 'STANDARD', 'PRO']);
    expect(body.plans[1]).toEqual({ code: 'STANDARD', name: 'Standard', monthlyPrice: { amountMinor: 690000, currency: 'LKR' } });
    expect(body.propertyTypes).toContainEqual({ code: 'GUEST_HOUSE', name: 'Guest House' });
    expect(body.provinces).toHaveLength(9);
    const uva = body.provinces.find((province: { name: string }) => province.name === 'Uva');
    expect(uva.districts).toEqual([
      { id: 22, name: 'Badulla' },
      { id: 23, name: 'Monaragala' },
    ]);
    const districts = body.provinces.flatMap((province: { districts: unknown[] }) => province.districts);
    expect(districts).toHaveLength(25);
  });

  it('creates the company, property, plan, Owner and audit entry together', async () => {
    const { body } = await createCompany().expect(201);

    expect(body).toMatchObject({
      company: {
        name: 'Outlaw Grand',
        subdomain: 'outlaw-grand',
        siteHost: `outlaw-grand.${process.env['PLATFORM_DOMAIN']}`,
        status: 'pending-setup',
        town: 'Ella',
        legalName: null,
        plan: { code: 'STANDARD', name: 'Standard' },
      },
      property: {
        name: 'Outlaw Grand Villa',
        slug: 'outlaw-grand-villa',
        type: { code: 'VILLA', name: 'Villa' },
        address: { line1: 'Ella–Passara Road', line2: null, city: 'Ella', district: { id: 22, name: 'Badulla' }, postalCode: '90090' },
      },
      owner: { fullName: 'Pasindu Bandara', email: 'owner@outlaw.example.com', phone: '+94787150428', status: 'invited' },
    });

    // The invite link is returned once and also "mailed" (logged in dev).
    const inviteUrl = new URL(body.invite.url);
    expect(inviteUrl.pathname).toBe('/accept-invite');
    expect(mail.invites).toHaveLength(1);
    expect(mail.invites[0]).toMatchObject({ to: 'owner@outlaw.example.com', companyName: 'Outlaw Grand', roleLabel: 'Owner' });
    expect(mail.invites[0].inviteUrl).toBe(body.invite.url);

    const companyId = body.company.id as string;
    const admin = await prisma.platformAdmin.findUniqueOrThrow({ where: { email: ADMIN_EMAIL } });
    const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    expect(company).toMatchObject({ status: 'PENDING_SETUP', createdById: admin.id });
    expect(await prisma.companyStatusChange.findMany({ where: { companyId } })).toEqual([
      expect.objectContaining({ fromStatus: null, toStatus: 'PENDING_SETUP', changedById: admin.id }),
    ]);
    expect(await prisma.subscription.findMany({ where: { companyId }, include: { plan: true } })).toEqual([
      expect.objectContaining({ status: 'PENDING', endedAt: null, plan: expect.objectContaining({ code: 'STANDARD' }) }),
    ]);
    expect(await prisma.staff.findMany({ where: { companyId } })).toEqual([
      expect.objectContaining({ role: 'OWNER', status: 'INVITED', phone: '+94787150428' }),
    ]);
    expect(await prisma.auditEntry.findMany({ where: { companyId } })).toEqual([
      expect.objectContaining({
        actorType: 'PLATFORM_ADMIN',
        actorId: admin.id,
        action: 'company.created',
        entityType: 'company',
        entityId: companyId,
        details: expect.objectContaining({ subdomain: 'outlaw-grand', planCode: 'STANDARD', propertyId: body.property.id }),
      }),
    ]);
  });

  it('the Owner accepting the invite completes setup', async () => {
    const { body } = await createCompany().expect(201);
    const accepted = await post('/auth/staff/invite/accept', { token: tokenOf(body.invite.url), password: PASSWORD }).expect(200);
    expect(accepted.body).toMatchObject({ staff: { role: 'owner', status: 'active' }, company: { status: 'active' } });
    expect(await prisma.auditEntry.findMany({ where: { companyId: body.company.id, action: 'company.owner_invite_accepted' } })).toEqual([
      expect.objectContaining({ actorType: 'STAFF', actorId: accepted.body.staff.id, details: { ip: expect.any(String) } }),
    ]);

    const history = await prisma.companyStatusChange.findMany({ where: { companyId: body.company.id }, orderBy: { changedAt: 'asc' } });
    expect(history.map((change) => [change.fromStatus, change.toStatus])).toEqual([
      [null, 'PENDING_SETUP'],
      ['PENDING_SETUP', 'ACTIVE'],
    ]);
    // No billing yet: the subscription starts with the company.
    expect(await prisma.subscription.findFirst({ where: { companyId: body.company.id, endedAt: null } })).toMatchObject({ status: 'ACTIVE' });
  });

  it('gives the second property with the same name the next free slug', async () => {
    await createCompany().expect(201);
    const second = await createCompany(
      companyRequest({ company: { subdomain: 'outlaw-two' }, owner: { email: 'second@outlaw.example.com' } }),
    ).expect(201);
    expect(second.body.property.slug).toBe('outlaw-grand-villa-2');
  });

  describe('refuses bad input without creating anything', () => {
    it('a subdomain already in use', async () => {
      await createCompany().expect(201);
      const response = await createCompany(companyRequest({ owner: { email: 'other@outlaw.example.com' } })).expect(409);
      expect(response.body).toMatchObject({ code: 'SUBDOMAIN_TAKEN', fieldErrors: { 'company.subdomain': [expect.any(String)] } });
      expect(await companyCount()).toBe(1);
    });

    it('an Owner email already used by a staff account', async () => {
      await createCompany().expect(201);
      const response = await createCompany(companyRequest({ company: { subdomain: 'another' } })).expect(409);
      expect(response.body).toMatchObject({ code: 'EMAIL_TAKEN', fieldErrors: { 'owner.email': [expect.any(String)] } });
      expect(await companyCount()).toBe(1);
    });

    it('unknown plan, property type and district, all reported at once', async () => {
      const response = await createCompany(
        companyRequest({
          company: { planCode: 'GOLD' },
          property: { typeCode: 'CASTLE', address: { line1: 'Main Street', city: 'Ella', districtId: 99 } },
        }),
      ).expect(400);
      expect(Object.keys(response.body.fieldErrors).sort()).toEqual(['company.planCode', 'property.address.districtId', 'property.typeCode']);
      expect(await companyCount()).toBe(0);
    });

    it('a reserved subdomain', async () => {
      const response = await createCompany(companyRequest({ company: { subdomain: 'backoffice' } })).expect(400);
      expect(response.body.fieldErrors).toEqual({ 'company.subdomain': ['This subdomain is reserved by the platform.'] });
    });

    it('malformed fields, with nested field paths', async () => {
      const response = await createCompany(
        companyRequest({
          company: { subdomain: '-Bad_Name-' },
          property: { name: 'Villa', typeCode: 'VILLA', address: { line1: '', city: 'Ella', districtId: 22, postalCode: '123' } },
          owner: { email: 'not-an-email', phone: '0771234567' },
        }),
      ).expect(400);
      expect(Object.keys(response.body.fieldErrors).sort()).toEqual([
        'company.subdomain',
        'owner.email',
        'owner.phone',
        'property.address.line1',
        'property.address.postalCode',
      ]);
    });

    it('rolls everything back when a later step fails', async () => {
      vi.spyOn(app.get(StaffService), 'createInvited').mockRejectedValueOnce(new Error('boom'));
      await createCompany().expect(500);
      expect(await companyCount()).toBe(0);
      expect(await prisma.property.count()).toBe(0);
      expect(await prisma.subscription.count()).toBe(0);
      expect(await prisma.auditEntry.count()).toBe(0);
      expect(mail.invites).toHaveLength(0);
    });
  });

  it('subdomain availability', async () => {
    await createCompany().expect(201);
    const check = async (label: string) => (await get(`/admin/subdomains/${label}/availability`, adminToken).expect(200)).body;
    expect(await check('Outlaw-Grand')).toEqual({ subdomain: 'outlaw-grand', available: false, reason: 'taken' });
    expect(await check('admin')).toEqual({ subdomain: 'admin', available: false, reason: 'reserved' });
    expect(await check('a')).toEqual({ subdomain: 'a', available: false, reason: 'invalid' });
    expect(await check('tea-hill')).toEqual({ subdomain: 'tea-hill', available: true, reason: null });
  });

  it('re-issues the Owner invite until it is accepted', async () => {
    const { body } = await createCompany().expect(201);
    const companyId = body.company.id as string;

    // The new link goes to the Owner's email only; the admin never sees it.
    const reissued = await post(`/admin/companies/${companyId}/owner-invite`, {}, adminToken).expect(200);
    expect(reissued.body).toEqual({ invite: { expiresAt: expect.any(String) } });
    const emailed = mail.invites.at(-1)!;
    expect(emailed).toMatchObject({ to: 'owner@outlaw.example.com', roleLabel: 'Owner' });
    expect(emailed.inviteUrl).not.toBe(body.invite.url);

    // The first link stopped working; the new one works once.
    await post('/auth/staff/invite/accept', { token: tokenOf(body.invite.url), password: PASSWORD }).expect(400);
    await post('/auth/staff/invite/accept', { token: tokenOf(emailed.inviteUrl), password: PASSWORD }).expect(200);

    const again = await post(`/admin/companies/${companyId}/owner-invite`, {}, adminToken).expect(409);
    expect(again.body.code).toBe('OWNER_ALREADY_ACTIVE');
    expect(await prisma.auditEntry.count({ where: { companyId, action: 'company.owner_invite_reissued' } })).toBe(1);

    await post('/admin/companies/0190f5c2-0000-7000-8000-000000000000/owner-invite', {}, adminToken).expect(404);
  });

  it('a company has exactly one Owner', async () => {
    const { body } = await createCompany().expect(201);
    const owner = await post('/auth/staff/invite/accept', { token: tokenOf(body.invite.url), password: PASSWORD }).expect(200);

    // Owners can't invite another Owner…
    const invite = await post('/staff', { fullName: 'Co Owner', email: 'co@outlaw.example.com', role: 'owner' }, owner.body.session.token);
    expect(invite.status).toBe(403);

    // …and the database refuses a second one regardless.
    await expect(
      prisma.staff.create({ data: { companyId: body.company.id, fullName: 'Second', email: 'second@outlaw.example.com', role: 'OWNER' } }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });
});
