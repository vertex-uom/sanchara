import { validateEnv } from './env.validation.js';

const valid = {
  DATABASE_URL: 'postgresql://user:secret@postgres:5432/db?schema=public',
  REDIS_URL: 'redis://redis:6379',
  WEB_APP_URL: 'http://localhost:3001',
  PLATFORM_DOMAIN: 'sanchara.localhost',
  GOOGLE_CLIENT_ID: 'id',
  GOOGLE_CLIENT_SECRET: 'secret',
  GOOGLE_CALLBACK_URL: 'http://localhost:3001/auth/google/callback',
  PORT: '3000',
};

describe('validateEnv', () => {
  it('accepts a complete environment and converts PORT to a number', () => {
    const env = validateEnv(valid);
    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
  });

  it('names missing or invalid variables without echoing values', () => {
    expect(() => validateEnv({ ...valid, REDIS_URL: 'http://not-redis', GOOGLE_CLIENT_SECRET: undefined })).toThrow(
      'Invalid environment variables: REDIS_URL, GOOGLE_CLIENT_SECRET',
    );
    expect(() => validateEnv({ ...valid, DATABASE_URL: 'nope' })).not.toThrow(/secret/);
  });
});
