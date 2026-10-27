import { HttpStatus, Injectable } from '@nestjs/common';
import { RedisService } from '../../../common/redis/redis.service.js';
import { AppException } from '../../../common/errors/app-exception.js';
import { LIMITS } from '../auth.policy.js';

type Window = { limit: number; window: number };

export function tooManyAttempts(retryAfterSeconds: number) {
  const seconds = Math.max(1, Math.ceil(retryAfterSeconds));
  return new AppException(
    HttpStatus.TOO_MANY_REQUESTS,
    'TOO_MANY_ATTEMPTS',
    'Too many attempts. Please wait and try again.',
    undefined,
    { 'Retry-After': String(seconds) },
  );
}

// Fixed-window counters and login lockout in Redis. Keys use hashed emails so
// addresses never appear in Redis. Counted for every email, existing or not.
@Injectable()
export class RateLimitService {
  constructor(private readonly redis: RedisService) {}

  // Counts one hit; throws 429 once the window's limit is exceeded.
  async consume(key: string, { limit, window }: Window): Promise<void> {
    const result = await this.redis.multi().incr(`rl:${key}`).expire(`rl:${key}`, window, 'NX').ttl(`rl:${key}`).exec();
    const count = Number(result?.[0]?.[1]);
    const ttl = Number(result?.[2]?.[1]);
    if (count > limit) throw tooManyAttempts(ttl > 0 ? ttl : window);
  }

  async assertNotLocked(emailHash: string): Promise<void> {
    const ttl = await this.redis.ttl(`lock:login:${emailHash}`);
    if (ttl > 0) throw tooManyAttempts(ttl);
  }

  // After the failure limit, the email is locked for the lock period.
  async recordLoginFailure(emailHash: string): Promise<void> {
    const { limit, window, lock } = LIMITS.loginFailuresPerEmail;
    const key = `rl:login-fail:${emailHash}`;
    const result = await this.redis.multi().incr(key).expire(key, window, 'NX').exec();
    if (Number(result?.[0]?.[1]) >= limit) {
      await this.redis.multi().set(`lock:login:${emailHash}`, '1', 'EX', lock).del(key).exec();
    }
  }

  async clearLoginFailures(emailHash: string): Promise<void> {
    await this.redis.del(`rl:login-fail:${emailHash}`, `lock:login:${emailHash}`);
  }
}
