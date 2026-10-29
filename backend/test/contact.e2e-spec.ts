import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { RedisService } from '../src/common/redis/redis.service.js';
import { AdminsService } from '../src/modules/auth/admins/admins.service.js';
import { PasswordService } from '../src/modules/auth/services/password.service.js';

const PASSWORD = 'correct horse battery';
const MESSAGE = { name: 'Tara Traveller', email: ' Tara@Example.com ', subject: 'support', message: 'My booking confirmation never arrived.' };

describe('Contact messages (e2e)', () => {
  let app: NestExpressApplication;
  let http: ReturnType<NestExpressApplication['getHttpServer']>;
  let prisma: PrismaService;
  let adminToken: string;

  const auth = <T extends request.Test>(call: T, token?: string) => (token ? call.set('Authorization', `Bearer ${token}`) : call);
  const get = (path: string, token?: string) => auth(request(http).get(`/v1${path}`), token);
  const post = (path: string, body: Record<string, unknown>, token?: string) => auth(request(http).post(`/v1${path}`).send(body), token);
  const put = (path: string, body: Record<string, unknown>, token?: string) => auth(request(http).put(`/v1${path}`).send(body), token);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();
    http = app.getHttpServer();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "contact_messages", "platform_admins" CASCADE');
    await app.get(RedisService).flushdb();
    const hash = await app.get(PasswordService).hash(PASSWORD);
    await app.get(AdminsService).create({ fullName: 'Kamala Silva', email: 'kamala@sanchara.example.com' }, hash);
    adminToken = (await post('/auth/admin/login', { email: 'kamala@sanchara.example.com', password: PASSWORD }).expect(200)).body.session.token as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it('anyone sends a message; the team lists it and marks it handled', async () => {
    await post('/contact', MESSAGE).expect(202);
    await post('/contact', { ...MESSAGE, email: 'other@example.com', subject: 'sales', message: 'Do you offer group rates?' }).expect(202);

    const open = (await get('/admin/contact-messages', adminToken).expect(200)).body;
    expect(open).toMatchObject({ total: 2, open: 2, page: 1, pageSize: 20 });
    expect(open.items[1]).toMatchObject({
      name: 'Tara Traveller',
      email: 'tara@example.com',
      subject: 'support',
      message: 'My booking confirmation never arrived.',
      handledAt: null,
      handledBy: null,
    });

    const handled = await put(`/admin/contact-messages/${open.items[1].id}/handled`, { handled: true }, adminToken).expect(200);
    expect(handled.body.message).toMatchObject({ handledBy: 'Kamala Silva' });
    expect((await get('/admin/contact-messages', adminToken).expect(200)).body).toMatchObject({ total: 1, open: 1 });
    expect((await get('/admin/contact-messages?status=handled', adminToken).expect(200)).body.items[0].email).toBe('tara@example.com');
    expect((await get('/admin/contact-messages?status=all', adminToken).expect(200)).body.total).toBe(2);

    await put(`/admin/contact-messages/${open.items[1].id}/handled`, { handled: false }, adminToken).expect(200);
    expect((await get('/admin/contact-messages', adminToken).expect(200)).body.open).toBe(2);
    await put('/admin/contact-messages/0190f5c2-0000-7000-8000-000000000000/handled', { handled: true }, adminToken).expect(404);
    await get('/admin/contact-messages').expect(401);
  });

  it('refuses bad input and too many messages', async () => {
    const bad = await post('/contact', { name: ' ', email: 'nope', subject: 'pizza', message: 'short' }).expect(400);
    expect(Object.keys(bad.body.fieldErrors).sort()).toEqual(['email', 'message', 'name', 'subject']);

    for (let i = 0; i < 3; i++) await post('/contact', MESSAGE).expect(202);
    const limited = await post('/contact', MESSAGE).expect(429);
    expect(limited.headers['retry-after']).toBeDefined();
    expect(await prisma.contactMessage.count()).toBe(3);
  });
});
