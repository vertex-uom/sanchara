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

// Captures mails instead of logging them.
class CapturingMailSender extends MailSender {
  readonly resets: PasswordResetMail[] = [];
  readonly invites: StaffInviteMail[] = [];
  sendPasswordReset(mail: PasswordResetMail) {
    this.resets.push(mail);
    return Promise.resolve();
  }
  sendStaffInvite(mail: StaffInviteMail) {
    this.invites.push(mail);
    return Promise.resolve();
  }
}

const PASSWORD = 'correct horse battery';
const tokenOf = (url: string) => new URL(url).searchParams.get('token')!;

describe('Staff auth (e2e)', () => {
  let app: NestExpressApplication;
  let http: ReturnType<NestExpressApplication['getHttpServer']>;
  const mail = new CapturingMailSender();

  const post = (path: string, body: Record<string, unknown>, token?: string) => {
    const call = request(http).post(`/v1${path}`).send(body);
    return token ? call.set('Authorization', `Bearer ${token}`) : call;
  };
  const me = (token: string) => request(http).get('/v1/me').set('Authorization', `Bearer ${token}`);
  const login = (email: string, password = PASSWORD) => post('/auth/staff/login', { email, password });
  const lastInviteToken = () => tokenOf(mail.invites.at(-1)!.inviteUrl);
  const accept = (token: string, password = PASSWORD) => post('/auth/staff/invite/accept', { token, password });

  // A company whose Owner has accepted the invite; returns the Owner's session token.
  async function companyWithOwner(subdomain: string, email = `owner@${subdomain}.example.com`) {
    const company = await app.get(CompaniesService).create({ name: `Hotel ${subdomain}`, subdomain });
    await app.get(StaffInvitesService).inviteOwner(company.id, { fullName: 'Owner', email });
    const accepted = await accept(lastInviteToken()).expect(200);
    return { company, token: accepted.body.session.token as string };
  }

  // Invites someone as `actorToken` and accepts the invite; returns their session token.
  async function addStaff(actorToken: string, email: string, role: string) {
    await post('/staff', { fullName: 'Staff Member', email, role }, actorToken).expect(201);
    return (await accept(lastInviteToken()).expect(200)).body.session.token as string;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailSender)
      .useValue(mail)
      .compile();
    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();
    http = app.getHttpServer();
  });

  beforeEach(async () => {
    await app.get(PrismaService).$executeRawUnsafe('TRUNCATE TABLE "companies", "guests" CASCADE');
    await app.get(RedisService).flushdb();
    mail.resets.length = 0;
    mail.invites.length = 0;
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('owner invite → check → accept → /me → logout → /me is 401', async () => {
    const company = await app.get(CompaniesService).create({ name: 'Palm Villa', subdomain: 'palm' });
    await app.get(StaffInvitesService).inviteOwner(company.id, { fullName: 'Minduli K', email: 'owner@palm.example.com' });

    const invite = mail.invites[0];
    expect(invite).toMatchObject({ to: 'owner@palm.example.com', companyName: 'Palm Villa', roleLabel: 'Owner' });
    expect(new URL(invite.inviteUrl).origin).toBe(process.env['BACKOFFICE_URL']?.replace(/\/$/, ''));
    expect(new URL(invite.inviteUrl).pathname).toBe('/accept-invite');

    const token = tokenOf(invite.inviteUrl);
    const check = await post('/auth/staff/invite/check', { token }).expect(200);
    expect(check.body).toEqual({
      invite: { fullName: 'Minduli K', email: 'owner@palm.example.com', role: 'owner', companyName: 'Palm Villa' },
    });

    const accepted = await accept(token).expect(200);
    expect(accepted.body).toMatchObject({
      staff: { email: 'owner@palm.example.com', role: 'owner', status: 'active' },
      company: { name: 'Palm Villa', subdomain: 'palm', status: 'active' },
      session: { rememberMe: false },
    });
    const session = accepted.body.session.token;

    const profile = await me(session).expect(200);
    expect(profile.body).toMatchObject({ audience: 'staff', staff: { role: 'owner' }, company: { subdomain: 'palm' } });
    expect(profile.body.staff.company).toBeUndefined();

    await post('/auth/staff/logout', {}, session).expect(204);
    await me(session).expect(401);
  });

  it('an invite is single-use, and a password typo does not burn it', async () => {
    const company = await app.get(CompaniesService).create({ name: 'Palm', subdomain: 'palm' });
    await app.get(StaffInvitesService).inviteOwner(company.id, { fullName: 'Owner', email: 'owner@palm.example.com' });
    const token = lastInviteToken();

    const sameAsEmail = await accept(token, 'OWNER@palm.example.com').expect(400);
    expect(sameAsEmail.body.fieldErrors).toEqual({ password: ['Password must not be the same as your email.'] });
    await accept(token, 'short').expect(400);

    await accept(token).expect(200);
    const reused = await accept(token).expect(400);
    expect(reused.body.code).toBe('INVITE_INVALID');
    await post('/auth/staff/invite/check', { token }).expect(400);
  });

  it('login: generic error for wrong password, unknown email and not-yet-accepted invites', async () => {
    const { token: owner } = await companyWithOwner('palm');
    await post('/staff', { fullName: 'Pending', email: 'pending@palm.example.com', role: 'manager' }, owner).expect(201);

    const ok = await post('/auth/staff/login', {
      email: ' OWNER@palm.example.com ',
      password: PASSWORD,
      rememberMe: true,
      returnTo: 'https://evil.com/',
    }).expect(200);
    expect(ok.body.session.rememberMe).toBe(true);
    expect(ok.body.returnTo).toBeNull();

    const wrong = await login('owner@palm.example.com', 'not the password').expect(401);
    const unknown = await login('nobody@palm.example.com', 'not the password').expect(401);
    const pending = await login('pending@palm.example.com', 'not the password').expect(401);
    expect(wrong.body).toEqual({ status: 401, code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' });
    expect(unknown.body).toEqual(wrong.body);
    expect(pending.body).toEqual(wrong.body);
  });

  it('locks a staff email after 5 failed logins without locking the same email for guests', async () => {
    await companyWithOwner('palm', 'shared@example.com');
    await post('/auth/guest/register', { fullName: 'Guest', email: 'shared@example.com', password: PASSWORD }).expect(201);

    for (let i = 0; i < 5; i++) await login('shared@example.com', 'wrong password').expect(401);
    const locked = await login('shared@example.com').expect(429);
    expect(locked.body.code).toBe('TOO_MANY_ATTEMPTS');

    await post('/auth/guest/login', { email: 'shared@example.com', password: PASSWORD }).expect(200);
  });

  it('who may invite whom', async () => {
    const { token: owner } = await companyWithOwner('palm');
    const manager = await addStaff(owner, 'manager@palm.example.com', 'manager');
    const frontDesk = await addStaff(manager, 'desk@palm.example.com', 'front-desk');

    const managerInvitesManager = await post('/staff', { fullName: 'X', email: 'x@palm.example.com', role: 'manager' }, manager);
    expect(managerInvitesManager.status).toBe(403);
    await post('/staff', { fullName: 'Y', email: 'y@palm.example.com', role: 'front-desk' }, frontDesk).expect(403);

    const duplicate = await post('/staff', { fullName: 'Z', email: 'DESK@palm.example.com', role: 'front-desk' }, owner);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.code).toBe('EMAIL_TAKEN');

    const invalid = await post('/staff', { fullName: '', email: 'nope', role: 'boss' }, owner).expect(400);
    expect(Object.keys(invalid.body.fieldErrors).sort()).toEqual(['email', 'fullName', 'role']);
  });

  it('resend: replaces the link, refuses accepted accounts and other companies', async () => {
    const { token: owner } = await companyWithOwner('palm');
    const { token: otherOwner } = await companyWithOwner('reef');

    const created = await post('/staff', { fullName: 'New', email: 'new@palm.example.com', role: 'front-desk' }, owner);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ staff: { status: 'invited', role: 'front-desk' }, invite: {} });
    const staffId = created.body.staff.id;
    const firstLink = lastInviteToken();

    await post(`/staff/${staffId}/invite`, {}, otherOwner).expect(404);
    await post(`/staff/${staffId}/invite`, {}, owner).expect(200);
    const secondLink = lastInviteToken();
    await accept(firstLink).expect(400);
    await accept(secondLink).expect(200);

    const again = await post(`/staff/${staffId}/invite`, {}, owner).expect(409);
    expect(again.body.code).toBe('NOT_INVITED');
  });

  it('guest and staff sessions never cross', async () => {
    const { token: staff } = await companyWithOwner('palm');
    const guest = await post('/auth/guest/register', { fullName: 'G', email: 'g@example.com', password: PASSWORD });

    await post('/staff', { fullName: 'X', email: 'x@palm.example.com', role: 'manager' }, guest.body.session.token).expect(401);
    await expect(me(guest.body.session.token)).resolves.toMatchObject({ body: { audience: 'guest' } });
    await expect(me(staff)).resolves.toMatchObject({ body: { audience: 'staff' } });
    // A staff logout call with a guest token leaves the guest session alone.
    await post('/auth/staff/logout', {}, guest.body.session.token).expect(204);
    await me(guest.body.session.token).expect(200);
  });

  it('forgot/reset: link on the Back Office host, single-use, signs out everywhere', async () => {
    const { token: oldSession } = await companyWithOwner('palm');

    await post('/auth/staff/password/forgot', { email: 'nobody@palm.example.com' }).expect(202);
    expect(mail.resets).toHaveLength(0);
    await post('/auth/staff/password/forgot', { email: 'owner@palm.example.com' }).expect(202);
    expect(mail.resets).toHaveLength(1);
    expect(new URL(mail.resets[0].resetUrl).pathname).toBe('/reset-password');

    const resetToken = tokenOf(mail.resets[0].resetUrl);
    // A guest reset endpoint never accepts a staff token.
    await post('/auth/guest/password/reset', { token: resetToken, newPassword: 'a brand new password' }).expect(400);

    await post('/auth/staff/password/reset', { token: resetToken, newPassword: 'a brand new password' }).expect(204);
    await me(oldSession).expect(401);
    await login('owner@palm.example.com').expect(401);
    await login('owner@palm.example.com', 'a brand new password').expect(200);
    const reused = await post('/auth/staff/password/reset', { token: resetToken, newPassword: 'another password' });
    expect(reused.body.code).toBe('RESET_TOKEN_INVALID');
  });

  describe('Google', () => {
    // Starts a staff Google sign-in and makes Google's token endpoint answer for `email`.
    async function googleAs(email: string, subject = 'google-sub-1') {
      const start = await post('/auth/staff/google/start', { returnTo: '/p/123' }).expect(200);
      const url = new URL(start.body.authorizationUrl);
      expect(url.searchParams.get('redirect_uri')).toBe(process.env['GOOGLE_STAFF_CALLBACK_URL']);

      const claims = {
        iss: 'https://accounts.google.com',
        aud: process.env['GOOGLE_CLIENT_ID'],
        exp: Math.floor(Date.now() / 1000) + 300,
        nonce: url.searchParams.get('nonce'),
        sub: subject,
        email,
        email_verified: true,
        name: 'Google Name',
      };
      const idToken = `h.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.s`;
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ id_token: idToken }));
      return start.body.state as string;
    }

    it('links an active account by email, then signs in by Google subject', async () => {
      await companyWithOwner('palm');

      const state = await googleAs('Owner@Palm.example.com');
      const first = await post('/auth/staff/google/callback', { code: 'c', state }).expect(200);
      expect(first.body).toMatchObject({ staff: { email: 'owner@palm.example.com' }, returnTo: '/p/123' });

      const again = await post('/auth/staff/google/callback', { code: 'c', state: await googleAs('changed@gmail.com') });
      expect(again.status).toBe(200);
      expect(again.body.staff.email).toBe('owner@palm.example.com');
    });

    it('never creates accounts or signs in invited ones', async () => {
      const { token: owner } = await companyWithOwner('palm');
      await post('/staff', { fullName: 'P', email: 'pending@palm.example.com', role: 'manager' }, owner).expect(201);

      for (const email of ['stranger@gmail.com', 'pending@palm.example.com']) {
        const state = await googleAs(email, `sub-${email}`);
        const response = await post('/auth/staff/google/callback', { code: 'c', state }).expect(403);
        expect(response.body.code).toBe('STAFF_ACCOUNT_UNAVAILABLE');
      }
    });

    it('a guest Google state cannot finish a staff sign-in', async () => {
      const guestStart = await post('/auth/guest/google/start', {}).expect(200);
      const response = await post('/auth/staff/google/callback', { code: 'c', state: guestStart.body.state }).expect(400);
      expect(response.body.code).toBe('OAUTH_STATE_INVALID');
    });
  });
});
