import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../../common/errors/app-exception.js';
import { SessionService } from '../../../common/security/session.service.js';
import { sha256 } from '../../../common/security/tokens.js';
import { AdminsService, toAdminProfile, type AdminProfile } from '../admins/admins.service.js';
import { LIMITS } from '../auth.policy.js';
import type { AdminLoginDto } from '../dto/admin-auth.dto.js';
import { PasswordService } from './password.service.js';
import { RateLimitService } from './rate-limit.service.js';

export type AdminAuthResult = {
  session: { token: string; expiresAt: string };
  admin: AdminProfile;
};

const invalidCredentials = () =>
  new AppException(HttpStatus.UNAUTHORIZED, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');

// Prefixed so admin counters never mix with guest or staff ones.
const lockKey = (email: string) => `admin:${sha256(email)}`;

// Platform admin sign-in: email + password. TODO(admin-2fa): the agreed design
// adds mandatory two-step verification after the password; until then admin
// sessions are kept short (see SESSION_TTL.admin).
@Injectable()
export class AdminAuthService {
  constructor(
    private readonly admins: AdminsService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
    private readonly limits: RateLimitService,
  ) {}

  // Every failure is the same 401, and unknown emails cost the same argon2 work.
  async login(input: AdminLoginDto, ip: string): Promise<AdminAuthResult> {
    await this.limits.consume(`admin-login:ip:${ip}`, LIMITS.loginPerIp);
    await this.limits.assertNotLocked(lockKey(input.email));

    const admin = await this.admins.findByEmailWithPassword(input.email);
    const hash = admin?.status === 'ACTIVE' ? admin.passwordCredential?.hash : undefined;
    const valid = hash ? await this.passwords.verify(hash, input.password) : await this.passwords.verifyDummy(input.password);
    if (!admin || !hash || !valid) {
      await this.limits.recordLoginFailure(lockKey(input.email));
      throw invalidCredentials();
    }

    await this.limits.clearLoginFailures(lockKey(input.email));
    if (this.passwords.needsRehash(hash)) await this.admins.setPasswordHash(admin.id, await this.passwords.hash(input.password));
    await this.admins.recordSignIn(admin.id);

    const session = await this.sessions.create('admin', admin.id, false);
    return { session: { token: session.token, expiresAt: session.expiresAt.toISOString() }, admin: toAdminProfile(admin) };
  }

  logout(token: string): Promise<void> {
    return this.sessions.destroy('admin', token);
  }
}
