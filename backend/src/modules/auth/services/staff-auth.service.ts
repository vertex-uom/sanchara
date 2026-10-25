import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AppConfig } from '../../../common/config/app-config.service.js';
import { AppException } from '../../../common/errors/app-exception.js';
import { OneTimeTokenService } from '../../../common/security/one-time-token.service.js';
import { SessionService } from '../../../common/security/session.service.js';
import { sha256 } from '../../../common/security/tokens.js';
import { normaliseEmail } from '../../../common/validation/normalise.js';
import type { Staff } from '../../../generated/prisma/client.js';
import { CompaniesService, toCompanyProfile, type CompanyProfile } from '../../companies/companies.service.js';
import { MailSender } from '../../messaging/mail/mail-sender.js';
import { StaffInvitesService, type InvitePreview } from '../../staff/staff-invites.service.js';
import { StaffService, toStaffProfile, type StaffProfile } from '../../staff/staff.service.js';
import { LIMITS, RESET_PASSWORD_PATH, RESET_TOKEN_TTL } from '../auth.policy.js';
import type { GoogleCallbackDto, LoginDto, ResetPasswordDto } from '../dto/guest-auth.dto.js';
import type { AcceptInviteDto } from '../dto/staff-auth.dto.js';
import { assertPasswordNotEmail } from '../helpers/password-rules.js';
import { safeReturnTo } from '../helpers/return-to.js';
import { GoogleOidcService } from './google-oidc.service.js';
import { PasswordService } from './password.service.js';
import { RateLimitService } from './rate-limit.service.js';

export type StaffAuthResult = {
  session: { token: string; expiresAt: string; rememberMe: boolean };
  staff: StaffProfile;
  company: CompanyProfile;
  returnTo: string | null;
};

const invalidCredentials = () =>
  new AppException(HttpStatus.UNAUTHORIZED, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');

const inviteInvalid = () =>
  new AppException(HttpStatus.BAD_REQUEST, 'INVITE_INVALID', 'This invite link is invalid or has expired.');

// Rate-limit and lockout keys are prefixed so staff and guest counters never mix.
const lockKey = (email: string) => `staff:${sha256(email)}`;

// Staff (Back Office) sign-in: email + password, Google (existing accounts only),
// invites, logout and password reset. Staff never sign themselves up.
@Injectable()
export class StaffAuthService {
  private readonly logger = new Logger(StaffAuthService.name);

  constructor(
    private readonly config: AppConfig,
    private readonly staff: StaffService,
    private readonly invites: StaffInvitesService,
    private readonly companies: CompaniesService,
    private readonly mail: MailSender,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
    private readonly limits: RateLimitService,
    private readonly tokens: OneTimeTokenService,
    private readonly google: GoogleOidcService,
  ) {}

  // Every failure is the same 401, and unknown emails cost the same argon2 work.
  async login(input: LoginDto, ip: string): Promise<StaffAuthResult> {
    await this.limits.consume(`staff-login:ip:${ip}`, LIMITS.loginPerIp);
    await this.limits.assertNotLocked(lockKey(input.email));

    const staff = await this.staff.findByEmailWithPassword(input.email);
    const hash = staff?.status === 'ACTIVE' ? staff.passwordCredential?.hash : undefined;
    const valid = hash ? await this.passwords.verify(hash, input.password) : await this.passwords.verifyDummy(input.password);
    if (!staff || !hash || !valid) {
      await this.limits.recordLoginFailure(lockKey(input.email));
      throw invalidCredentials();
    }

    await this.limits.clearLoginFailures(lockKey(input.email));
    if (this.passwords.needsRehash(hash)) await this.staff.setPasswordHash(staff.id, await this.passwords.hash(input.password));
    return this.signIn(staff, input.rememberMe ?? false, this.cleanReturnTo(input.returnTo));
  }

  logout(token: string): Promise<void> {
    return this.sessions.destroy('staff', token);
  }

  googleStart(returnTo: string | undefined) {
    return this.google.start('staff', this.cleanReturnTo(returnTo));
  }

  // Known identity → sign in. Otherwise an active account with the same (Google-
  // verified) email is linked. Google never creates staff accounts.
  async googleCallback({ code, state }: GoogleCallbackDto): Promise<StaffAuthResult> {
    const { profile, returnTo } = await this.google.complete('staff', code, state);
    const identity = { subject: profile.subject, email: normaliseEmail(profile.email) };

    let staff = await this.staff.findByGoogleSubject(identity.subject);
    if (!staff) {
      const existing = await this.staff.findByEmail(identity.email);
      if (existing?.status === 'ACTIVE') {
        // Lost a race with a parallel callback: the identity is linked already.
        staff = (await this.staff.linkGoogle(existing, identity)) ? existing : await this.staff.findByGoogleSubject(identity.subject);
      }
    }

    if (!staff || staff.status !== 'ACTIVE') {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        'STAFF_ACCOUNT_UNAVAILABLE',
        'No active Back Office account uses this Google account. Ask your Owner or Manager for an invite.',
      );
    }
    return this.signIn(staff, false, returnTo);
  }

  async checkInvite(token: string): Promise<InvitePreview> {
    const preview = await this.invites.preview(token);
    if (!preview) throw inviteInvalid();
    return preview;
  }

  // Sets the password, activates the account and signs in. The token is used up
  // only after the password passes the rules, so a typo doesn't burn the link.
  async acceptInvite({ token, password, rememberMe }: AcceptInviteDto): Promise<StaffAuthResult> {
    const pending = await this.invites.pendingStaff(token);
    if (!pending) throw inviteInvalid();
    assertPasswordNotEmail(password, pending.email, 'password');

    const hash = await this.passwords.hash(password);
    const staffId = await this.invites.consume(token);
    const staff = staffId === pending.id ? await this.staff.activate(pending.id, hash) : null;
    if (!staff) throw inviteInvalid();
    // The Owner of a company the platform team created has finished setup.
    if (staff.role === 'OWNER') await this.companies.completeSetup(staff.companyId);
    return this.signIn(staff, rememberMe ?? false, null);
  }

  // Always the same answer; an email is sent only to an active account.
  async forgotPassword(email: string, ip: string): Promise<void> {
    await this.limits.consume(`staff-forgot:ip:${ip}`, LIMITS.forgotPerIp);
    await this.limits.consume(`staff-forgot:email:${sha256(email)}`, LIMITS.forgotPerEmail);

    const staff = await this.staff.findByEmail(email);
    if (!staff || staff.status !== 'ACTIVE') return;

    const token = await this.tokens.issue('staff-password-reset', staff.id, RESET_TOKEN_TTL);
    const resetUrl = new URL(RESET_PASSWORD_PATH, this.config.backofficeUrl);
    resetUrl.searchParams.set('token', token);
    // Not awaited, so the response time doesn't depend on the mail transport.
    this.mail
      .sendPasswordReset({ to: staff.email, name: staff.fullName, resetUrl: resetUrl.toString() })
      .catch((error: unknown) => this.logger.error('Password reset mail failed', error instanceof Error ? error.stack : undefined));
  }

  // Single-use token. Signs the staff member out everywhere and lifts any login lock.
  async resetPassword({ token, newPassword }: ResetPasswordDto): Promise<void> {
    const staffId = await this.tokens.consume('staff-password-reset', token);
    const staff = staffId ? await this.staff.findById(staffId) : null;
    if (!staff || staff.status !== 'ACTIVE') {
      throw new AppException(HttpStatus.BAD_REQUEST, 'RESET_TOKEN_INVALID', 'This link is invalid or has expired.');
    }
    assertPasswordNotEmail(newPassword, staff.email, 'newPassword');

    await this.staff.setPasswordHash(staff.id, await this.passwords.hash(newPassword));
    await this.sessions.destroyAll('staff', staff.id);
    await this.limits.clearLoginFailures(lockKey(staff.email));
  }

  private async signIn(staff: Staff, rememberMe: boolean, returnTo: string | null): Promise<StaffAuthResult> {
    const company = await this.companies.findById(staff.companyId);
    if (!company) throw invalidCredentials();
    const session = await this.sessions.create('staff', staff.id, rememberMe);
    return {
      session: { token: session.token, expiresAt: session.expiresAt.toISOString(), rememberMe },
      staff: toStaffProfile(staff),
      company: toCompanyProfile(company),
      returnTo,
    };
  }

  // The Back Office is one host, so only same-site paths are allowed.
  private cleanReturnTo(value: string | undefined): string | null {
    return safeReturnTo(value, { isAllowedHost: () => false, allowHttp: false });
  }
}
