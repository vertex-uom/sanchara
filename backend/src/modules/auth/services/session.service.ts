import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../common/redis/redis.service.js';
import { SESSION_TTL } from '../auth.policy.js';
import { isWellFormedToken, randomToken, sha256 } from '../helpers/tokens.js';

// One store for every audience; staff and admin reuse it later with their own TTLs.
export type Audience = 'guest';

type StoredSession = { sub: string; remember: boolean; createdAt: number };
export type ActiveSession = { subjectId: string; rememberMe: boolean; expiresAt: Date };
export type IssuedSession = { token: string; rememberMe: boolean; expiresAt: Date };

const sessionKey = (audience: Audience, hash: string) => `sess:${audience}:${hash}`;
const indexKey = (audience: Audience, subjectId: string) => `sess-index:${audience}:${subjectId}`;

// Opaque session ids in Redis. The client holds the token; Redis holds only its hash.
@Injectable()
export class SessionService {
  constructor(private readonly redis: RedisService) {}

  async create(audience: Audience, subjectId: string, rememberMe: boolean): Promise<IssuedSession> {
    const token = randomToken();
    const hash = sha256(token);
    const ttl = rememberMe ? SESSION_TTL.remember : SESSION_TTL.normal;
    const value: StoredSession = { sub: subjectId, remember: rememberMe, createdAt: Date.now() };

    await this.redis
      .multi()
      .set(sessionKey(audience, hash), JSON.stringify(value), 'EX', ttl)
      .sadd(indexKey(audience, subjectId), hash)
      .expire(indexKey(audience, subjectId), SESSION_TTL.absolute)
      .exec();
    return { token, rememberMe, expiresAt: new Date(Date.now() + ttl * 1000) };
  }

  // Valid session → extends its idle TTL (never past the absolute cap). Otherwise null.
  async resolve(audience: Audience, token: string): Promise<ActiveSession | null> {
    if (!isWellFormedToken(token)) return null;
    const key = sessionKey(audience, sha256(token));
    const raw = await this.redis.get(key);
    if (!raw) return null;

    const session = JSON.parse(raw) as StoredSession;
    const remainingAbsolute = Math.floor((session.createdAt + SESSION_TTL.absolute * 1000 - Date.now()) / 1000);
    if (remainingAbsolute <= 0) {
      await this.destroy(audience, token);
      return null;
    }
    const ttl = Math.min(session.remember ? SESSION_TTL.remember : SESSION_TTL.normal, remainingAbsolute);
    await this.redis.expire(key, ttl);
    return { subjectId: session.sub, rememberMe: session.remember, expiresAt: new Date(Date.now() + ttl * 1000) };
  }

  async destroy(audience: Audience, token: string): Promise<void> {
    if (!isWellFormedToken(token)) return;
    const hash = sha256(token);
    const raw = await this.redis.getdel(sessionKey(audience, hash));
    if (raw) await this.redis.srem(indexKey(audience, (JSON.parse(raw) as StoredSession).sub), hash);
  }

  // Signs the subject out everywhere (password reset, account linking).
  async destroyAll(audience: Audience, subjectId: string): Promise<void> {
    const hashes = await this.redis.smembers(indexKey(audience, subjectId));
    const keys = [...hashes.map((hash) => sessionKey(audience, hash)), indexKey(audience, subjectId)];
    await this.redis.del(...keys);
  }
}
