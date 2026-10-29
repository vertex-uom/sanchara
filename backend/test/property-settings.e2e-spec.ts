import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { RedisService } from '../src/common/redis/redis.service.js';
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

const BASIC = {
  name: 'Palm Breeze Guest House',
  type: 'villa',
  description: 'A quiet villa by the sea.',
  starRating: 4,
  establishedYear: 2015,
  category: 'beachfront',
};
const CONTACT = {
  phone: '+94 91 222 3344',
  email: ' Stay@Palm.Example.com ',
  whatsapp: '',
  website: 'https://palm.example.com',
  addressLine1: '12 Lighthouse Street',
  addressLine2: null,
  town: 'Unawatuna',
  district: 'Galle',
  postalCode: '80600',
  mapUrl: null,
};
const POLICIES = {
  checkInFrom: '13:00',
  checkInUntil: null,
  checkOutBy: '10:30',
  cancellation: 'strict',
  childrenAllowed: false,
  petsAllowed: true,
  smoking: 'designated-areas',
  houseRules: 'Quiet hours after 10 pm.',
};
const INTEGRATIONS = {
  googleAnalyticsId: 'G-AB12CD34EF',
  metaPixelId: null,
  googleBusinessUrl: null,
  tripAdvisorUrl: 'https://tripadvisor.com/palm',
  bookingComIcalUrl: null,
  airbnbIcalUrl: null,
};
const ADVANCED = { sltdaNumber: 'SL/123-45', vatNumber: '123456789-7000', invoicePrefix: 'pb', bookingWindowDays: 400, minNoticeHours: 12 };

describe('Property settings (e2e)', () => {
  let app: NestExpressApplication;
  let http: ReturnType<NestExpressApplication['getHttpServer']>;
  const mail = new CapturingMailSender();

  const auth = <T extends request.Test>(call: T, token: string) => call.set('Authorization', `Bearer ${token}`);
  const get = (path: string, token: string) => auth(request(http).get(`/v1${path}`), token);
  const put = (path: string, body: Record<string, unknown>, token: string) => auth(request(http).put(`/v1${path}`).send(body), token);
  const post = (path: string, body: Record<string, unknown>, token?: string) => {
    const call = request(http).post(`/v1${path}`).send(body);
    return token ? auth(call, token) : call;
  };
  const accept = (portal: string) => post('/auth/staff/invite/accept', { token: tokenOf(mail.invites.at(-1)!.inviteUrl), password: PASSWORD, portal });

  // A company with one property in Galle and an Owner who has signed in.
  async function companyWithProperty(subdomain: string) {
    const company = await app.get(CompaniesService).create({ name: `Hotel ${subdomain}`, subdomain });
    const galle = await app.get(PrismaService).district.findUniqueOrThrow({ where: { name: 'Galle' } });
    const property = await app.get(PropertiesService).create({
      companyId: company.id,
      propertyTypeId: 1,
      name: `${subdomain} House`,
      address: { line1: '1 Main Street', line2: null, city: 'Galle', districtId: galle.id, postalCode: null },
    });
    await app.get(StaffInvitesService).inviteOwner(company.id, { fullName: 'Owner', email: `owner@${subdomain}.example.com` });
    const owner = (await accept('owner').expect(200)).body.session.token as string;
    return { company, propertyId: property.id, owner };
  }

  async function addStaff(ownerToken: string, email: string, role: string) {
    await post('/staff', { fullName: 'Staff Member', email, role }, ownerToken).expect(201);
    return (await accept('staff').expect(200)).body.session.token as string;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(MailSender).useValue(mail).compile();
    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();
    http = app.getHttpServer();
  });

  beforeEach(async () => {
    await app.get(PrismaService).$executeRawUnsafe('TRUNCATE TABLE "companies", "guests", "audit_entries" CASCADE');
    await app.get(RedisService).flushdb();
    mail.invites.length = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  it('new properties start with defaults; every role lists its own company only', async () => {
    const { propertyId, owner } = await companyWithProperty('palm');
    const manager = await addStaff(owner, 'manager@palm.example.com', 'manager');
    await companyWithProperty('lagoon');

    const settings = await get(`/properties/${propertyId}/settings`, owner).expect(200);
    expect(settings.body.property).toMatchObject({
      id: propertyId,
      name: 'palm House',
      town: 'Galle',
      country: 'Sri Lanka',
      status: 'active',
      version: 1,
      basic: { name: 'palm House', type: 'guest-house', description: '', starRating: null, establishedYear: null, category: null },
      contact: { phone: '', email: '', addressLine1: '1 Main Street', town: 'Galle', district: 'Galle', country: 'Sri Lanka' },
      policies: { checkInFrom: '14:00', checkInUntil: null, checkOutBy: '11:00', cancellation: 'moderate', smoking: 'not-allowed' },
      amenities: [],
      advanced: { invoicePrefix: 'INV', bookingWindowDays: 365, minNoticeHours: 0 },
    });

    const list = await get('/properties', manager).expect(200);
    expect(list.body.properties).toEqual([{ id: propertyId, name: 'palm House', town: 'Galle', country: 'Sri Lanka', status: 'active' }]);
  });

  it('the Owner saves every tab; each save bumps the version and is audited', async () => {
    const { propertyId, owner } = await companyWithProperty('palm');
    const save = async (section: string, body: Record<string, unknown>, version: number) =>
      (await put(`/properties/${propertyId}/settings/${section}`, { ...body, version }, owner).expect(200)).body.property;

    expect((await save('basic', BASIC, 1)).basic).toEqual(BASIC);
    expect((await save('contact', CONTACT, 2)).contact).toEqual({
      ...CONTACT,
      email: 'stay@palm.example.com',
      whatsapp: null,
      country: 'Sri Lanka',
    });
    expect((await save('policies', POLICIES, 3)).policies).toEqual(POLICIES);
    expect((await save('amenities', { amenities: ['pool', 'wifi'] }, 4)).amenities).toEqual(['pool', 'wifi']);
    expect((await save('integrations', INTEGRATIONS, 5)).integrations).toEqual(INTEGRATIONS);
    const last = await save('advanced', ADVANCED, 6);
    expect(last.advanced).toEqual({ ...ADVANCED, invoicePrefix: 'PB' });
    expect(last).toMatchObject({ version: 7, name: BASIC.name, town: 'Unawatuna' });

    const audit = await app.get(PrismaService).auditEntry.findMany({ where: { entityId: propertyId }, orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }] });
    expect(audit.map((entry) => entry.action)).toEqual(Array(6).fill('property.settings_updated'));
    expect(audit[0].details).toEqual({
      section: 'basic',
      fields: ['name', 'type', 'description', 'starRating', 'establishedYear', 'category'],
    });
    expect(audit[3].details).toEqual({ section: 'amenities', fields: ['amenities'] });
  });

  it('a save from an older version is refused, and nothing changes', async () => {
    const { propertyId, owner } = await companyWithProperty('palm');
    await put(`/properties/${propertyId}/settings/amenities`, { amenities: ['wifi'], version: 1 }, owner).expect(200);

    const stale = await put(`/properties/${propertyId}/settings/amenities`, { amenities: ['pool'], version: 1 }, owner).expect(409);
    expect(stale.body.code).toBe('STALE');
    const settings = await get(`/properties/${propertyId}/settings`, owner).expect(200);
    expect(settings.body.property).toMatchObject({ version: 2, amenities: ['wifi'] });
  });

  it('only the Owner reads or changes settings', async () => {
    const { propertyId, owner } = await companyWithProperty('palm');
    const manager = await addStaff(owner, 'manager@palm.example.com', 'manager');
    const desk = await addStaff(owner, 'desk@palm.example.com', 'front-desk');

    for (const token of [manager, desk]) {
      const read = await get(`/properties/${propertyId}/settings`, token).expect(403);
      expect(read.body).toEqual({ status: 403, code: 'FORBIDDEN', message: 'Only the Owner can do this.' });
      await put(`/properties/${propertyId}/settings/basic`, { ...BASIC, version: 1 }, token).expect(403);
      await put(`/properties/${propertyId}/status`, { status: 'inactive' }, token).expect(403);
    }
    await get(`/properties/${propertyId}/settings`, 'not-a-session').expect(401);
    await request(http).get('/v1/properties').expect(401);

    const settings = await get(`/properties/${propertyId}/settings`, owner).expect(200);
    expect(settings.body.property).toMatchObject({ version: 1, status: 'active', basic: { name: 'palm House' } });
  });

  it("another company's property reads as not found", async () => {
    const { owner } = await companyWithProperty('palm');
    const { propertyId: theirs } = await companyWithProperty('lagoon');

    await get(`/properties/${theirs}/settings`, owner).expect(404);
    await put(`/properties/${theirs}/settings/amenities`, { amenities: [], version: 1 }, owner).expect(404);
    await put(`/properties/${theirs}/status`, { status: 'inactive' }, owner).expect(404);
    await get('/properties/not-a-uuid/settings', owner).expect(400);
  });

  it('refuses bad input with field errors', async () => {
    const { propertyId, owner } = await companyWithProperty('palm');
    const bad = (section: string, body: Record<string, unknown>) =>
      put(`/properties/${propertyId}/settings/${section}`, { version: 1, ...body }, owner).expect(400);

    const basic = await bad('basic', { ...BASIC, name: ' ', type: 'castle', starRating: 6, establishedYear: 1700, category: 'moon' });
    expect(Object.keys(basic.body.fieldErrors).sort()).toEqual(['category', 'establishedYear', 'name', 'starRating']);
    expect((await bad('basic', { ...BASIC, type: 'castle' })).body.fieldErrors).toEqual({ type: ['Choose a property type.'] });
    expect((await bad('basic', { ...BASIC, establishedYear: 3000 })).body.fieldErrors.establishedYear).toHaveLength(1);

    const contact = await bad('contact', { ...CONTACT, phone: 'call me', email: 'nope', website: 'http://palm.example.com', postalCode: '123' });
    expect(Object.keys(contact.body.fieldErrors).sort()).toEqual(['email', 'phone', 'postalCode', 'website']);
    expect((await bad('contact', { ...CONTACT, district: 'Atlantis' })).body.fieldErrors).toEqual({ district: ['Choose a district.'] });

    expect(Object.keys((await bad('policies', { ...POLICIES, checkInFrom: '25:00', smoking: 'sometimes' })).body.fieldErrors).sort()).toEqual([
      'checkInFrom',
      'smoking',
    ]);
    expect((await bad('amenities', { amenities: ['wifi', 'helipad'] })).body.fieldErrors).toHaveProperty('amenities');
    expect(Object.keys((await bad('advanced', { ...ADVANCED, invoicePrefix: 'TOO-LONG', bookingWindowDays: 5 })).body.fieldErrors).sort()).toEqual([
      'bookingWindowDays',
      'invoicePrefix',
    ]);
    expect((await bad('amenities', { amenities: [], slug: 'mine' })).body.fieldErrors).toHaveProperty('slug');
    await put(`/properties/${propertyId}/settings/amenities`, { amenities: [] }, owner).expect(400);

    const settings = await get(`/properties/${propertyId}/settings`, owner).expect(200);
    expect(settings.body.property.version).toBe(1);
  });

  it('the Owner deactivates and reactivates the property; each change is audited once', async () => {
    const { propertyId, owner } = await companyWithProperty('palm');

    expect((await put(`/properties/${propertyId}/status`, { status: 'inactive' }, owner).expect(200)).body.property.status).toBe('inactive');
    await put(`/properties/${propertyId}/status`, { status: 'inactive' }, owner).expect(200);
    const back = await put(`/properties/${propertyId}/status`, { status: 'active' }, owner).expect(200);
    expect(back.body.property).toMatchObject({ status: 'active', version: 1 });
    await put(`/properties/${propertyId}/status`, { status: 'closed' }, owner).expect(400);

    const audit = await app.get(PrismaService).auditEntry.findMany({ where: { entityId: propertyId }, orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }] });
    expect(audit.map((entry) => entry.details)).toEqual([
      { from: 'active', to: 'inactive' },
      { from: 'inactive', to: 'active' },
    ]);
  });
});
