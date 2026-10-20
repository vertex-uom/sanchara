import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../common/redis/redis.service.js';
import { RESET_TOKEN_TTL } from '../auth.policy.js';
import { isWellFormedToken, randomToken, sha256 } from '../helpers/tokens.js';

const tokenKey = (hash: string) => `pwreset:${hash}`;
const latestKey = (guestId: string) => `pwreset-latest:${guestId}`;

// Random, single-use, short-lived reset tokens, stored hashed. Issuing a new
// token cancels the previous one for the same guest.
@Injectable()
export class PasswordResetService {
  constructor(private readonly redis: RedisService) {}

  async issue(guestId: string, ttlSeconds = RESET_TOKEN_TTL): Promise<string> {
    const token = randomToken();
    const hash = sha256(token);
    const previous = await this.redis.getset(latestKey(guestId), hash);

    const tx = this.redis.multi().set(tokenKey(hash), guestId, 'EX', ttlSeconds).expire(latestKey(guestId), ttlSeconds);
    if (previous) tx.del(tokenKey(previous));
    await tx.exec();
    return token;
  }

  // Returns the guest id once; a second use, an expired or unknown token gives null.
  async consume(token: string): Promise<string | null> {
    if (!isWellFormedToken(token)) return null;
    const guestId = await this.redis.getdel(tokenKey(sha256(token)));
    if (guestId) await this.redis.del(latestKey(guestId));
    return guestId;
  }
}
