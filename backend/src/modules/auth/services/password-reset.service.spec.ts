import { testRedis } from '../../../../test/support/test-redis.js';
import { PasswordResetService } from './password-reset.service.js';

describe('PasswordResetService', () => {
  const redis = testRedis();
  const service = new PasswordResetService(redis);

  beforeEach(async () => {
    await redis.flushdb();
  });

  afterAll(async () => {
    await redis.quit();
  });

  it('is single-use', async () => {
    const token = await service.issue('guest-1');
    await expect(service.consume(token)).resolves.toBe('guest-1');
    await expect(service.consume(token)).resolves.toBeNull();
  });

  it('expires', async () => {
    const token = await service.issue('guest-1', 1);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await expect(service.consume(token)).resolves.toBeNull();
  });

  it('a newer token cancels the older one', async () => {
    const older = await service.issue('guest-1');
    const newer = await service.issue('guest-1');
    await expect(service.consume(older)).resolves.toBeNull();
    await expect(service.consume(newer)).resolves.toBe('guest-1');
  });

  it('stores only a hash of the token', async () => {
    const token = await service.issue('guest-1');
    const keys = await redis.keys('*');
    expect(keys.some((key) => key.includes(token))).toBe(false);
    for (const key of keys) {
      const value = await redis.get(key);
      expect(value).not.toContain(token);
    }
  });

  it('rejects malformed and unknown tokens', async () => {
    await expect(service.consume('short')).resolves.toBeNull();
    await expect(service.consume('A'.repeat(43))).resolves.toBeNull();
  });
});
