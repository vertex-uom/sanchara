import { Test, type TestingModule } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';

describe('App (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = configureApp(moduleFixture.createNestApplication<NestExpressApplication>());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health reports database and redis up', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', database: 'up', redis: 'up' });
  });

  it('unknown routes return the shared error shape and a request id', async () => {
    const response = await request(app.getHttpServer()).get('/v1/nope').expect(404);
    expect(response.body).toMatchObject({ status: 404, code: 'NOT_FOUND' });
    expect(response.headers['x-request-id']).toBeTruthy();
  });
});
