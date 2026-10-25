import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service.js';
import { isWellFormedToken, randomToken, sha256 } from './tokens.js';

// What a token is for. Tokens of one purpose never redeem as another.
export type TokenPurpose = 'guest-password-reset' | 'staff-password-reset' | 'staff-invite';

const tokenKey = (purpose: TokenPurpose, hash: string) => `ott:${purpose}:${hash}`;
const latestKey = (purpose: TokenPurpose, subjectId: string) => `ott-latest:${purpose}:${subjectId}`;

// Random, single-use, short-lived tokens (password reset, staff invites), stored
// hashed. Issuing a new token cancels the previous one for the same subject and purpose.
@Injectable()
export class OneTimeTokenService {
  constructor(private readonly redis: RedisService) {}

  async issue(purpose: TokenPurpose, subjectId: string, ttlSeconds: number): Promise<string> {
    const token = randomToken();
    const hash = sha256(token);
    const previous = await this.redis.getset(latestKey(purpose, subjectId), hash);

    const tx = this.redis
      .multi()
      .set(tokenKey(purpose, hash), subjectId, 'EX', ttlSeconds)
      .expire(latestKey(purpose, subjectId), ttlSeconds);
    if (previous) tx.del(tokenKey(purpose, previous));
    await tx.exec();
    return token;
  }

  // The subject id without using the token up (e.g. to show who an invite is for).
  async peek(purpose: TokenPurpose, token: string): Promise<string | null> {
    if (!isWellFormedToken(token)) return null;
    return this.redis.get(tokenKey(purpose, sha256(token)));
  }

  // Returns the subject id once; a second use, an expired or unknown token gives null.
  async consume(purpose: TokenPurpose, token: string): Promise<string | null> {
    if (!isWellFormedToken(token)) return null;
    const subjectId = await this.redis.getdel(tokenKey(purpose, sha256(token)));
    if (subjectId) await this.redis.del(latestKey(purpose, subjectId));
    return subjectId;
  }
}
