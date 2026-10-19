import { Redis } from 'ioredis';
import type { RedisService } from '../../src/common/redis/redis.service.js';

// A Redis client on the test database chosen by the Vitest config. Refuses
// database 0 (dev data) because tests flush it.
export function testRedis(): RedisService {
  const url = process.env['REDIS_URL'];
  const db = url ? new URL(url).pathname.slice(1) : '';
  if (!url || db === '' || db === '0') throw new Error('Tests need REDIS_URL with a non-zero database');
  return new Redis(url) as unknown as RedisService;
}
