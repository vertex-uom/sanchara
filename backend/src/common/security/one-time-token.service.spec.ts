import { testRedis } from '../../../test/support/test-redis.js';
import { OneTimeTokenService } from './one-time-token.service.js';

const TTL = 60;

describe('OneTimeTokenService', () => {
  const redis = testRedis();
  const service = new OneTimeTokenService(redis);

  beforeEach(async () => {
    await redis.flushdb();
  });

  afterAll(async () => {
    await redis.quit();
  });

  it('is single-use', async () => {
    const token = await service.issue('guest-password-reset', 'guest-1', TTL);
    await expect(service.consume('guest-password-reset', token)).resolves.toBe('guest-1');
    await expect(service.consume('guest-password-reset', token)).resolves.toBeNull();
  });

  it('peek does not use the token up', async () => {
    const token = await service.issue('staff-invite', 'staff-1', TTL);
    await expect(service.peek('staff-invite', token)).resolves.toBe('staff-1');
    await expect(service.consume('staff-invite', token)).resolves.toBe('staff-1');
    await expect(service.peek('staff-invite', token)).resolves.toBeNull();
  });

  it('expires', async () => {
    const token = await service.issue('guest-password-reset', 'guest-1', 1);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await expect(service.consume('guest-password-reset', token)).resolves.toBeNull();
  });

  it('a newer token cancels the older one', async () => {
    const older = await service.issue('guest-password-reset', 'guest-1', TTL);
    const newer = await service.issue('guest-password-reset', 'guest-1', TTL);
    await expect(service.consume('guest-password-reset', older)).resolves.toBeNull();
    await expect(service.consume('guest-password-reset', newer)).resolves.toBe('guest-1');
  });

  it('never redeems a token for another purpose', async () => {
    const token = await service.issue('staff-invite', 'staff-1', TTL);
    await expect(service.consume('staff-password-reset', token)).resolves.toBeNull();
    await expect(service.consume('staff-invite', token)).resolves.toBe('staff-1');
  });

  it('stores only a hash of the token', async () => {
    const token = await service.issue('guest-password-reset', 'guest-1', TTL);
    const keys = await redis.keys('*');
    expect(keys.some((key) => key.includes(token))).toBe(false);
    for (const key of keys) {
      const value = await redis.get(key);
      expect(value).not.toContain(token);
    }
  });

  it('rejects malformed and unknown tokens', async () => {
    await expect(service.consume('guest-password-reset', 'short')).resolves.toBeNull();
    await expect(service.consume('guest-password-reset', 'A'.repeat(43))).resolves.toBeNull();
  });
});
