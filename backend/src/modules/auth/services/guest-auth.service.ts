import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AppConfig } from '../../../common/config/app-config.service.js';
import { AppException } from '../../../common/errors/app-exception.js';
import { DomainsService } from '../../domains/domains.service.js';
import { GuestsService, toProfile, type GuestProfile } from '../../guests/guests.service.js';
import { MailSender } from '../../messaging/mail/mail-sender.js';
import type { Guest } from '../../../generated/prisma/client.js';
import { LIMITS, RESET_PASSWORD_PATH } from '../auth.policy.js';
import type { GoogleCallbackDto, LoginDto, RegisterDto, ResetPasswordDto } from '../dto/guest-auth.dto.js';
import { normaliseEmail } from '../helpers/normalise.js';
import { safeReturnTo } from '../helpers/return-to.js';
import { sha256 } from '../helpers/tokens.js';
import { GoogleOidcService } from './google-oidc.service.js';
import { PasswordResetService } from './password-reset.service.js';
import { PasswordService } from './password.service.js';
import { RateLimitService } from './rate-limit.service.js';
import { SessionService, type IssuedSession } from './session.service.js';

export type AuthResult = {
  session: { token: string; expiresAt: string; rememberMe: boolean };
  guest: GuestProfile;
  returnTo: string | null;
};

const invalidCredentials = () =>
  new AppException(HttpStatus.UNAUTHORIZED, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');

function samePasswordAsEmail(password: string, email: string) {
  return normaliseEmail(password) === email;
}

// Guest sign-up, sign-in, Google, logout and password reset.
@Injectable()
export class GuestAuthService {
  private readonly logger = new Logger(GuestAuthService.name);

  constructor(
    private readonly config: AppConfig,
    private readonly guests: GuestsService,
    private readonly domains: DomainsService,
    private readonly mail: MailSender,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
    private readonly limits: RateLimitService,
    private readonly resets: PasswordResetService,
    private readonly google: GoogleOidcService,
  ) {}

  async register(input: RegisterDto, ip: string): Promise<AuthResult> {
    await this.limits.consume(`register:ip:${ip}`, LIMITS.registerPerIp);
    if (samePasswordAsEmail(input.password, input.email)) {
      throw new AppException(HttpStatus.BAD_REQUEST, 'VALIDATION_FAILED', 'Some fields are invalid.', {
        password: ['Password must not be the same as your email.'],
      });
    }
    const hash = await this.passwords.hash(input.password);
    const guest = await this.guests.registerWithPassword(
      { fullName: input.fullName, email: input.email, mobile: input.mobile ?? null },
      hash,
    );
    return this.signIn(guest, input.rememberMe ?? false, this.cleanReturnTo(input.returnTo));
  }

  // Every failure is the same 401, and unknown emails cost the same argon2 work.
  async login(input: LoginDto, ip: string): Promise<AuthResult> {
    const emailKey = sha256(input.email);
    await this.limits.consume(`login:ip:${ip}`, LIMITS.loginPerIp);
    await this.limits.assertNotLocked(emailKey);

    const guest = await this.guests.findByEmailWithPassword(input.email);
    const hash = guest?.status === 'ACTIVE' ? guest.passwordCredential?.hash : undefined;
    const valid = hash ? await this.passwords.verify(hash, input.password) : await this.passwords.verifyDummy(input.password);
    if (!guest || !hash || !valid) {
      await this.limits.recordLoginFailure(emailKey);
      throw invalidCredentials();
    }

    await this.limits.clearLoginFailures(emailKey);
    if (this.passwords.needsRehash(hash)) await this.guests.setPasswordHash(guest.id, await this.passwords.hash(input.password));
    return this.signIn(guest, input.rememberMe ?? false, this.cleanReturnTo(input.returnTo));
  }

  logout(token: string): Promise<void> {
    return this.sessions.destroy('guest', token);
  }

  googleStart(returnTo: string | undefined) {
    return this.google.start(this.cleanReturnTo(returnTo));
  }

  // Known identity → sign in. Same email → link (safely). Otherwise a new guest.
  async googleCallback({ code, state }: GoogleCallbackDto): Promise<AuthResult> {
    const { profile, returnTo } = await this.google.complete(code, state);
    const identity = { subject: profile.subject, email: normaliseEmail(profile.email) };

    let guest = await this.guests.findByGoogleSubject(identity.subject);
    if (!guest) {
      const existing = await this.guests.findByEmail(identity.email);
      if (existing) {
        guest = await this.guests.linkGoogle(existing, identity);
        // Unverified accounts lose their password, so also end their sessions.
        if (guest && existing.emailVerifiedAt === null) await this.sessions.destroyAll('guest', existing.id);
      } else {
        const fullName = (profile.name ?? identity.email.split('@')[0]).slice(0, 120);
        guest = await this.guests.registerFromGoogle({ fullName, email: identity.email }, identity);
      }
      // Lost a race with a parallel callback for the same Google account.
      guest ??= await this.guests.findByGoogleSubject(identity.subject);
    }

    if (!guest || guest.status !== 'ACTIVE') {
      throw new AppException(HttpStatus.FORBIDDEN, 'ACCOUNT_UNAVAILABLE', 'This account cannot sign in right now.');
    }
    return this.signIn(guest, false, returnTo);
  }

  // Always the same answer; an email is sent only if the account exists.
  async forgotPassword(email: string, ip: string): Promise<void> {
    await this.limits.consume(`forgot:ip:${ip}`, LIMITS.forgotPerIp);
    await this.limits.consume(`forgot:email:${sha256(email)}`, LIMITS.forgotPerEmail);

    const guest = await this.guests.findByEmail(email);
    if (!guest || guest.status !== 'ACTIVE') return;

    const token = await this.resets.issue(guest.id);
    const resetUrl = new URL(RESET_PASSWORD_PATH, this.config.webAppUrl);
    resetUrl.searchParams.set('token', token);
    // Not awaited, so the response time doesn't depend on the mail transport.
    this.mail
      .sendPasswordReset({ to: guest.email, name: guest.fullName, resetUrl: resetUrl.toString() })
      .catch((error: unknown) => this.logger.error('Password reset mail failed', error instanceof Error ? error.stack : undefined));
  }

  // Single-use token. Signs the guest out everywhere and lifts any login lock.
  async resetPassword({ token, newPassword }: ResetPasswordDto): Promise<void> {
    const guestId = await this.resets.consume(token);
    const guest = guestId ? await this.guests.findById(guestId) : null;
    if (!guest || guest.status !== 'ACTIVE') {
      throw new AppException(HttpStatus.BAD_REQUEST, 'RESET_TOKEN_INVALID', 'This link is invalid or has expired.');
    }
    if (samePasswordAsEmail(newPassword, guest.email)) {
      throw new AppException(HttpStatus.BAD_REQUEST, 'VALIDATION_FAILED', 'Some fields are invalid.', {
        newPassword: ['Password must not be the same as your email.'],
      });
    }

    await this.guests.setPasswordHash(guest.id, await this.passwords.hash(newPassword));
    await this.sessions.destroyAll('guest', guest.id);
    await this.limits.clearLoginFailures(sha256(guest.email));
  }

  private async signIn(guest: Guest, rememberMe: boolean, returnTo: string | null): Promise<AuthResult> {
    const session: IssuedSession = await this.sessions.create('guest', guest.id, rememberMe);
    return {
      session: { token: session.token, expiresAt: session.expiresAt.toISOString(), rememberMe },
      guest: toProfile(guest),
      returnTo,
    };
  }

  private cleanReturnTo(value: string | undefined): string | null {
    return safeReturnTo(value, {
      isAllowedHost: (host) => this.domains.isRegisteredHost(host),
      allowHttp: !this.config.isProduction,
    });
  }
}
