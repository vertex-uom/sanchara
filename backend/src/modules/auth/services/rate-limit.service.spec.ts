import { AppException } from '../../../common/errors/app-exception.js';
import { testRedis } from '../../../../test/support/test-redis.js';
import { LIMITS } from '../auth.policy.js';
import { RateLimitService } from './rate-limit.service.js';

async function caught(promise: Promise<unknown>): Promise<AppException> {
  try {
    await promise;
  } catch (error) {
    return error as AppException;
  }
  throw new Error('expected a rejection');
}

describe('RateLimitService', () => {
  const redis = testRedis();
  const service = new RateLimitService(redis);

  beforeEach(async () => {
    await redis.flushdb();
  });

  afterAll(async () => {
    await redis.quit();
  });

  it('allows up to the limit, then answers 429 with Retry-After', async () => {
    const window = { limit: 3, window: 60 };
    for (let i = 0; i < 3; i++) await service.consume('test:ip:1', window);

    const error = await caught(service.consume('test:ip:1', window));
    expect(error).toBeInstanceOf(AppException);
    expect(error.getStatus()).toBe(429);
    expect(error.code).toBe('TOO_MANY_ATTEMPTS');
    expect(Number(error.headers?.['Retry-After'])).toBeGreaterThan(0);
    expect(Number(error.headers?.['Retry-After'])).toBeLessThanOrEqual(60);
  });

  it('counts keys separately', async () => {
    const window = { limit: 1, window: 60 };
    await service.consume('test:ip:1', window);
    await expect(service.consume('test:ip:2', window)).resolves.toBeUndefined();
  });

  it('starts a new window after it expires', async () => {
    const window = { limit: 1, window: 1 };
    await service.consume('test:ip:1', window);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await expect(service.consume('test:ip:1', window)).resolves.toBeUndefined();
  });

  it('locks an email after the failure limit and reports the lock time', async () => {
    const { limit, lock } = LIMITS.loginFailuresPerEmail;
    for (let i = 0; i < limit - 1; i++) await service.recordLoginFailure('email-hash');
    await expect(service.assertNotLocked('email-hash')).resolves.toBeUndefined();

    await service.recordLoginFailure('email-hash');
    const error = await caught(service.assertNotLocked('email-hash'));
    expect(error.getStatus()).toBe(429);
    expect(Number(error.headers?.['Retry-After'])).toBeLessThanOrEqual(lock);
  });

  it('a successful login clears failures and the lock', async () => {
    for (let i = 0; i < LIMITS.loginFailuresPerEmail.limit; i++) await service.recordLoginFailure('email-hash');
    await service.clearLoginFailures('email-hash');
    await expect(service.assertNotLocked('email-hash')).resolves.toBeUndefined();
  });
});
