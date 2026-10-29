import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app-exception.js';
import { SessionService } from '../../common/security/session.service.js';
import type { Staff, StaffRole } from '../../generated/prisma/client.js';
import { AuditService } from '../audit/audit.service.js';
import { StaffInvitesService, type InviteSent } from './staff-invites.service.js';
import { INVITABLE_ROLES } from './staff.policy.js';
import { ROLE_NAMES, ROLES_BY_NAME, StaffService, toStaffProfile, type SignedInStaff, type StaffProfile, type StaffRoleName, type StaffStatusName } from './staff.service.js';

// A row of the Staff Management page.
export type StaffMemberView = StaffProfile & {
  activatedAt: string | null;
  // Invited accounts: when the current invite link expires (null: expired).
  inviteExpiresAt: string | null;
  // The signed-in user may change this account (role, deactivate, reactivate, resend).
  manageable: boolean;
  // This is the signed-in user.
  you: boolean;
};

export type StaffListView = {
  members: StaffMemberView[];
  // Active and invited accounts against the plan's limit (null = no limit).
  seats: { used: number; limit: number | null };
};

type ListFilters = { role?: StaffRoleName; status?: StaffStatusName; q?: string };

const STATUSES_BY_NAME: Record<StaffStatusName, Staff['status']> = { invited: 'INVITED', active: 'ACTIVE', inactive: 'INACTIVE' };

const notFound = () => new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'That staff account no longer exists.');
const forbidden = (message: string) => new AppException(HttpStatus.FORBIDDEN, 'FORBIDDEN', message);
const limitReached = () =>
  new AppException(HttpStatus.CONFLICT, 'LIMIT_REACHED', "Your plan's staff limit is reached. Upgrade the plan or deactivate an account first.");
const changed = () => new AppException(HttpStatus.CONFLICT, 'CONFLICT', 'This account was changed meanwhile. Reload and try again.');

// Staff Management for the signed-in user's company. The Owner manages Managers
// and Front Desk; a Manager manages Front Desk. A company has one Owner, who
// can't be changed here, and nobody changes or deactivates their own account.
// Seats: active and invited accounts count against the current plan's limit.
@Injectable()
export class StaffManagementService {
  constructor(
    private readonly staff: StaffService,
    private readonly invites: StaffInvitesService,
    private readonly sessions: SessionService,
    private readonly audit: AuditService,
  ) {}

  async list(actor: SignedInStaff, { role, status, q }: ListFilters): Promise<StaffListView> {
    const [members, seats] = await Promise.all([
      this.staff.listForCompany(actor.company.id, {
        role: role ? ROLES_BY_NAME[role] : undefined,
        status: status ? STATUSES_BY_NAME[status] : undefined,
        q: q || undefined,
      }),
      this.staff.seatUsage(actor.company.id),
    ]);
    const invited = members.filter((member) => member.status === 'INVITED').map((member) => member.id);
    const expiries = invited.length ? await this.invites.inviteExpiries(invited) : new Map<string, Date | null>();
    return {
      members: members.map((member) => ({
        ...toStaffProfile(member),
        activatedAt: member.activatedAt?.toISOString() ?? null,
        inviteExpiresAt: expiries.get(member.id)?.toISOString() ?? null,
        manageable: this.mayManage(actor, member),
        you: member.id === actor.id,
      })),
      seats,
    };
  }

  // Adds an INVITED account and emails its link, within the plan's seats.
  async invite(actor: SignedInStaff, input: { fullName: string; email: string; role: StaffRole }) {
    await this.assertSeatFree(actor.company.id);
    const result = await this.invites.invite(actor, input);
    await this.record(actor, 'staff.invited', result.staff, { role: ROLE_NAMES[input.role] });
    return result;
  }

  async resendInvite(actor: SignedInStaff, staffId: string): Promise<InviteSent> {
    const target = await this.member(actor, staffId);
    this.assertMayManage(actor, target);
    const invite = await this.invites.resend(actor, staffId);
    await this.record(actor, 'staff.invite_resent', target, {});
    return invite;
  }

  async changeRole(actor: SignedInStaff, staffId: string, roleName: Exclude<StaffRoleName, 'owner'>): Promise<StaffProfile> {
    const target = await this.member(actor, staffId);
    this.assertMayManage(actor, target);
    const role = ROLES_BY_NAME[roleName];
    if (!INVITABLE_ROLES[ROLES_BY_NAME[actor.role]].includes(role)) throw forbidden("You can't give this role.");
    if (target.role === role) return toStaffProfile(target);

    const updated = await this.staff.update(target.id, { role: target.role }, { role });
    if (!updated) throw changed();
    // Signed-in sessions pick up the new role on their next request.
    await this.record(actor, 'staff.role_changed', updated, { from: ROLE_NAMES[target.role], to: roleName });
    return toStaffProfile(updated);
  }

  // Signs the account out everywhere; an invited account's link stops working.
  async deactivate(actor: SignedInStaff, staffId: string): Promise<StaffProfile> {
    const target = await this.member(actor, staffId);
    this.assertMayManage(actor, target);
    if (target.status === 'INACTIVE') return toStaffProfile(target);

    const updated = await this.staff.update(target.id, { status: target.status }, { status: 'INACTIVE' });
    if (!updated) throw changed();
    await this.sessions.destroyAll('staff', target.id);
    await this.record(actor, 'staff.deactivated', updated, { from: toStaffProfile(target).status });
    return toStaffProfile(updated);
  }

  // Back to active, or to invited (with a new link) if the invite was never accepted.
  async reactivate(actor: SignedInStaff, staffId: string): Promise<StaffProfile> {
    const target = await this.member(actor, staffId);
    this.assertMayManage(actor, target);
    if (target.status !== 'INACTIVE') return toStaffProfile(target);

    await this.assertSeatFree(actor.company.id);
    const status = target.activatedAt ? 'ACTIVE' : 'INVITED';
    const updated = await this.staff.update(target.id, { status: 'INACTIVE' }, { status });
    if (!updated) throw changed();
    if (status === 'INVITED') await this.invites.send(updated);
    await this.record(actor, 'staff.reactivated', updated, { to: toStaffProfile(updated).status });
    return toStaffProfile(updated);
  }

  private async member(actor: SignedInStaff, staffId: string): Promise<Staff> {
    const target = await this.staff.findById(staffId);
    if (!target || target.companyId !== actor.company.id) throw notFound();
    return target;
  }

  private mayManage(actor: SignedInStaff, target: Staff) {
    return target.id !== actor.id && INVITABLE_ROLES[ROLES_BY_NAME[actor.role]].includes(target.role);
  }

  private assertMayManage(actor: SignedInStaff, target: Staff) {
    if (target.id === actor.id) throw forbidden("You can't change your own account.");
    if (!this.mayManage(actor, target)) throw forbidden("You can't change this account.");
  }

  private async assertSeatFree(companyId: string) {
    const { used, limit } = await this.staff.seatUsage(companyId);
    if (limit !== null && used >= limit) throw limitReached();
  }

  private record(actor: SignedInStaff, action: string, target: Staff, details: Record<string, string>) {
    return this.audit.record({
      actor: { type: 'STAFF', id: actor.id },
      action,
      entity: { type: 'staff', id: target.id },
      companyId: actor.company.id,
      details: { name: target.fullName, ...details },
    });
  }
}
