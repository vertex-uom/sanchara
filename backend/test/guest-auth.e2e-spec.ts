import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { RedisService } from '../src/common/redis/redis.service.js';
import { MailSender, type PasswordResetMail } from '../src/modules/messaging/mail/mail-sender.js';

// Captures reset mails instead of logging them.
class CapturingMailSender extends MailSender {
  readonly sent: PasswordResetMail[] = [];
  sendPasswordReset(mail: PasswordResetMail) {
    this.sent.push(mail);
    return Promise.resolve();
  }
  sendStaffInvite() {
    return Promise.resolve();
  }
}

const PASSWORD = 'correct horse battery';

describe('Guest auth (e2e)', () => {
  let app: NestExpressApplication;
  let http: ReturnType<NestExpressApplication['getHttpServer']>;
  const mail = new CapturingMailSender();

  const register = (body: Record<string, unknown>) => request(http).post('/v1/auth/guest/register').send(body);
  const login = (body: Record<string, unknown>) => request(http).post('/v1/auth/guest/login').send(body);
  const me = (token: string) => request(http).get('/v1/me').set('Authorization', `Bearer ${token}`);

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
    await app.get(PrismaService).$executeRawUnsafe('TRUNCATE TABLE "guests" CASCADE');
    await app.get(RedisService).flushdb();
    mail.sent.length = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  it('register → /me → logout → /me is 401', async () => {
    const created = await register({
      fullName: 'Nisal Rathnaka',
      email: ' Nisal@Example.com ',
      password: PASSWORD,
      mobile: '+94 77 123 4567',
      returnTo: '/account',
    }).expect(201);

    expect(created.body).toMatchObject({
      guest: { fullName: 'Nisal Rathnaka', email: 'nisal@example.com', mobile: '+94771234567', emailVerified: false },
      session: { rememberMe: false },
      returnTo: '/account',
    });
    const { token } = created.body.session;
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const profile = await me(token).expect(200);
    expect(profile.body).toMatchObject({ audience: 'guest', guest: { email: 'nisal@example.com' } });

    await request(http).post('/v1/auth/guest/logout').set('Authorization', `Bearer ${token}`).expect(204);
    const after = await me(token).expect(401);
    expect(after.body).toEqual({ status: 401, code: 'UNAUTHENTICATED', message: 'Please sign in.' });
  });

  it('login works with remember me and drops unsafe return-to targets', async () => {
    await register({ fullName: 'Guest', email: 'guest@example.com', password: PASSWORD }).expect(201);

    const response = await login({
      email: 'GUEST@example.com',
      password: PASSWORD,
      rememberMe: true,
      returnTo: '//evil.com',
    }).expect(200);
    expect(response.body.session.rememberMe).toBe(true);
    expect(response.body.returnTo).toBeNull();
    await me(response.body.session.token).expect(200);
  });

  it('gives the same generic error for a wrong password and an unknown email', async () => {
    await register({ fullName: 'Guest', email: 'guest@example.com', password: PASSWORD }).expect(201);

    const wrong = await login({ email: 'guest@example.com', password: 'not the password' }).expect(401);
    const unknown = await login({ email: 'nobody@example.com', password: 'not the password' }).expect(401);
    expect(wrong.body).toEqual(unknown.body);
    expect(wrong.body).toEqual({ status: 401, code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' });
  });

  it('rejects a duplicate email and invalid fields', async () => {
    await register({ fullName: 'Guest', email: 'guest@example.com', password: PASSWORD }).expect(201);
    const duplicate = await register({ fullName: 'Other', email: 'guest@example.com', password: PASSWORD }).expect(409);
    expect(duplicate.body.code).toBe('EMAIL_TAKEN');

    const invalid = await register({ fullName: '', email: 'nope', password: 'short', mobile: '0771234567' }).expect(400);
    expect(Object.keys(invalid.body.fieldErrors).sort()).toEqual(['email', 'fullName', 'mobile', 'password']);
  });

  it('locks an email after 5 failed logins, even for the right password', async () => {
    await register({ fullName: 'Guest', email: 'guest@example.com', password: PASSWORD }).expect(201);
    for (let i = 0; i < 5; i++) await login({ email: 'guest@example.com', password: 'wrong password' }).expect(401);

    const locked = await login({ email: 'guest@example.com', password: PASSWORD }).expect(429);
    expect(locked.body.code).toBe('TOO_MANY_ATTEMPTS');
    expect(Number(locked.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('forgot password answers the same for unknown emails; reset is single-use and signs out everywhere', async () => {
    const created = await register({ fullName: 'Guest', email: 'guest@example.com', password: PASSWORD }).expect(201);
    const oldToken = created.body.session.token;

    await request(http).post('/v1/auth/guest/password/forgot').send({ email: 'nobody@example.com' }).expect(202);
    expect(mail.sent).toHaveLength(0);
    await request(http).post('/v1/auth/guest/password/forgot').send({ email: 'guest@example.com' }).expect(202);
    expect(mail.sent).toHaveLength(1);

    const resetToken = new URL(mail.sent[0].resetUrl).searchParams.get('token');
    const reset = (token: string | null) =>
      request(http).post('/v1/auth/guest/password/reset').send({ token, newPassword: 'a brand new password' });

    await reset(resetToken).expect(204);
    await me(oldToken).expect(401);
    await login({ email: 'guest@example.com', password: PASSWORD }).expect(401);
    await login({ email: 'guest@example.com', password: 'a brand new password' }).expect(200);

    const reused = await reset(resetToken).expect(400);
    expect(reused.body.code).toBe('RESET_TOKEN_INVALID');
  });

  it('Google start returns an authorization URL with PKCE and state', async () => {
    const response = await request(http).post('/v1/auth/guest/google/start').send({ returnTo: '/account' }).expect(200);
    const url = new URL(response.body.authorizationUrl);
    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('state')).toBe(response.body.state);

    // An unknown state never reaches Google.
    const callback = await request(http)
      .post('/v1/auth/guest/google/callback')
      .send({ code: 'x', state: 'A'.repeat(43) })
      .expect(400);
    expect(callback.body.code).toBe('OAUTH_STATE_INVALID');
  });
});
