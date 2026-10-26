import { testRedis } from '../../../test/support/test-redis.js';
import { SESSION_TTL, SessionService } from './session.service.js';

describe('SessionService', () => {
  const redis = testRedis();
  const service = new SessionService(redis);

  beforeEach(async () => {
    await redis.flushdb();
  });

  afterAll(async () => {
    await redis.quit();
  });

  it('resolves a new session and uses the normal or remember-me TTL', async () => {
    const normal = await service.create('guest', 'guest-1', false);
    const remembered = await service.create('guest', 'guest-1', true);

    await expect(service.resolve('guest', normal.token)).resolves.toMatchObject({ subjectId: 'guest-1', rememberMe: false });
    const ttls = await Promise.all((await redis.keys('sess:guest:*')).map((key) => redis.ttl(key)));
    expect(ttls.sort((a, b) => a - b)).toEqual([SESSION_TTL.guest.normal, SESSION_TTL.guest.remember]);
    expect(remembered.expiresAt.getTime()).toBeGreaterThan(normal.expiresAt.getTime());
  });

  it('logout destroys the session on the server', async () => {
    const { token } = await service.create('guest', 'guest-1', false);
    await service.destroy('guest', token);
    await expect(service.resolve('guest', token)).resolves.toBeNull();
  });

  it('destroyAll signs the subject out everywhere, and only that subject', async () => {
    const a = await service.create('guest', 'guest-1', false);
    const b = await service.create('guest', 'guest-1', true);
    const other = await service.create('guest', 'guest-2', false);

    await service.destroyAll('guest', 'guest-1');
    await expect(service.resolve('guest', a.token)).resolves.toBeNull();
    await expect(service.resolve('guest', b.token)).resolves.toBeNull();
    await expect(service.resolve('guest', other.token)).resolves.not.toBeNull();
  });

  it('ends sessions past the absolute lifetime', async () => {
    const { token } = await service.create('guest', 'guest-1', true);
    const [key] = await redis.keys('sess:guest:*');
    const stored = JSON.parse((await redis.get(key))!) as { createdAt: number };
    stored.createdAt -= (SESSION_TTL.guest.absolute + 1) * 1000;
    await redis.set(key, JSON.stringify(stored), 'KEEPTTL');

    await expect(service.resolve('guest', token)).resolves.toBeNull();
    await expect(redis.exists(key)).resolves.toBe(0);
  });

  it('keeps audiences apart and uses each audience\'s TTLs', async () => {
    const { token } = await service.create('staff', 'staff-1', false);
    await expect(service.resolve('guest', token)).resolves.toBeNull();
    await expect(service.resolve('staff', token)).resolves.toMatchObject({ subjectId: 'staff-1' });
    const [key] = await redis.keys('sess:staff:*');
    await expect(redis.ttl(key)).resolves.toBe(SESSION_TTL.staff.normal);
  });

  it('ignores malformed tokens', async () => {
    await expect(service.resolve('guest', 'not a token')).resolves.toBeNull();
  });
});
