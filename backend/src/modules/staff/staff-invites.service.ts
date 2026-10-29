import { HttpStatus, Injectable } from '@nestjs/common';
import { AppConfig } from '../../common/config/app-config.service.js';
import { AppException } from '../../common/errors/app-exception.js';
import { OneTimeTokenService } from '../../common/security/one-time-token.service.js';
import type { Staff, StaffRole } from '../../generated/prisma/client.js';
import { CompaniesService } from '../companies/companies.service.js';
import { MailSender } from '../messaging/mail/mail-sender.js';
import { ACCEPT_INVITE_PATH, INVITABLE_ROLES, INVITE_TOKEN_TTL, portalOf, portalPath } from './staff.policy.js';
import { ROLE_LABELS, ROLE_NAMES, ROLES_BY_NAME, StaffService, type SignedInStaff, type StaffRoleName } from './staff.service.js';

export type InviteSent = { expiresAt: string };

// The link itself, for the platform team to pass on while email isn't connected.
export type InviteLink = InviteSent & { url: string };

// Shown on the accept-invite page before the password is set.
export type InvitePreview = { fullName: string; email: string; role: StaffRoleName; companyName: string };

const notFound = () => new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'That staff account no longer exists.');

// Staff invites: an INVITED account plus a single-use link (stored hashed) that
// lets the person set their password. Accepting is done by the auth module.
@Injectable()
export class StaffInvitesService {
  constructor(
    private readonly config: AppConfig,
    private readonly tokens: OneTimeTokenService,
    private readonly mail: MailSender,
    private readonly companies: CompaniesService,
    private readonly staff: StaffService,
  ) {}

  // Owner or Manager adds a staff account to their own company.
  async invite(actor: SignedInStaff, input: { fullName: string; email: string; role: StaffRole }) {
    this.assertMayInvite(actor, input.role);
    const staff = await this.staff.createInvited({ companyId: actor.company.id, ...input });
    return { staff, invite: await this.send(staff) };
  }

  // A new link for an account that hasn't accepted yet; the old link stops working.
  async resend(actor: SignedInStaff, staffId: string): Promise<InviteSent> {
    const staff = await this.staff.findById(staffId);
    if (!staff || staff.companyId !== actor.company.id) throw notFound();
    this.assertMayInvite(actor, staff.role);
    if (staff.status !== 'INVITED') {
      throw new AppException(HttpStatus.CONFLICT, 'NOT_INVITED', 'This account has already accepted its invite.');
    }
    return this.send(staff);
  }

  // First Owner of a new company. No actor: used by the dev seed now and by
  // Platform Admin company creation later.
  async inviteOwner(companyId: string, input: { fullName: string; email: string }) {
    const staff = await this.staff.createInvited({ companyId, ...input, role: 'OWNER' });
    return { staff, invite: await this.send(staff) };
  }

  // Issues a new invite link (cancelling any older one) and emails it.
  async send(staff: Staff): Promise<InviteSent> {
    const { expiresAt } = await this.issue(staff);
    return { expiresAt };
  }

  // Same as send(), but also returns the link. Only for company creation, where
  // the platform team hands the first link to the Owner; re-issued links are
  // only ever emailed (send()).
  sendWithLink(staff: Staff): Promise<InviteLink> {
    return this.issue(staff);
  }

  // When each account's current invite link expires; null when it has none
  // (expired or already used).
  async inviteExpiries(staffIds: string[]): Promise<Map<string, Date | null>> {
    const expiries = await this.tokens.expiries('staff-invite', staffIds);
    return new Map(staffIds.map((id, i) => [id, expiries[i] ?? null]));
  }

  private async issue(staff: Staff): Promise<InviteLink> {
    const company = await this.companies.findById(staff.companyId);
    if (!company) throw notFound();

    const token = await this.tokens.issue('staff-invite', staff.id, INVITE_TOKEN_TTL);
    const inviteUrl = new URL(portalPath(portalOf(staff.role), ACCEPT_INVITE_PATH), this.config.backofficeUrl);
    inviteUrl.searchParams.set('token', token);
    // Awaited: whoever sent the invite should hear if the email failed.
    await this.mail.sendStaffInvite({
      to: staff.email,
      name: staff.fullName,
      companyName: company.name,
      roleLabel: ROLE_LABELS[staff.role],
      inviteUrl: inviteUrl.toString(),
    });
    return { url: inviteUrl.toString(), expiresAt: new Date(Date.now() + INVITE_TOKEN_TTL * 1000).toISOString() };
  }

  // The invited account behind a token, without using it up. Null if the token
  // is invalid or expired, or the account is no longer waiting for its invite.
  async pendingStaff(token: string): Promise<Staff | null> {
    const staffId = await this.tokens.peek('staff-invite', token);
    const staff = staffId ? await this.staff.findById(staffId) : null;
    return staff?.status === 'INVITED' ? staff : null;
  }

  async preview(token: string): Promise<InvitePreview | null> {
    const staff = await this.pendingStaff(token);
    const company = staff ? await this.companies.findById(staff.companyId) : null;
    if (!staff || !company) return null;
    return { fullName: staff.fullName, email: staff.email, role: ROLE_NAMES[staff.role], companyName: company.name };
  }

  // Uses the token up; returns the staff id it was issued for.
  consume(token: string): Promise<string | null> {
    return this.tokens.consume('staff-invite', token);
  }

  private assertMayInvite(actor: SignedInStaff, role: StaffRole) {
    if (!INVITABLE_ROLES[ROLES_BY_NAME[actor.role]].includes(role)) {
      throw new AppException(HttpStatus.FORBIDDEN, 'FORBIDDEN', "You can't invite staff with this role.");
    }
  }
}
