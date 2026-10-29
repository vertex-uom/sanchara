import type { StaffRole } from '../../generated/prisma/client.js';

// Invite links stay valid for 72 hours; sending a new one cancels the old one.
export const INVITE_TOKEN_TTL = 72 * 60 * 60;

// The Back Office has two sign-in portals on one host: Owners use the owner
// portal, Managers and Front Desk the staff portal. An account works only in
// its own portal, and its emails link to its own portal, so the owner portal's
// address never reaches staff.
export type StaffPortal = 'owner' | 'staff';
export const STAFF_PORTALS: readonly StaffPortal[] = ['owner', 'staff'];

export function portalOf(role: StaffRole): StaffPortal {
  return role === 'OWNER' ? 'owner' : 'staff';
}

// A Back Office page in a portal: "/owner/accept-invite" or "/accept-invite".
export function portalPath(portal: StaffPortal, path: string) {
  return portal === 'owner' ? `/owner${path}` : path;
}

// Back Office page that handles the invite link (inside the invitee's portal).
export const ACCEPT_INVITE_PATH = '/accept-invite';

// Roles each role may invite (Owner manages Managers and Front Desk, Manager
// manages Front Desk). A company has exactly one Owner (enforced by the
// database); the platform team creates it, and transfer is a separate feature.
// TEMPORARY: moves to the capabilities module once it exists.
export const INVITABLE_ROLES: Record<StaffRole, readonly StaffRole[]> = {
  OWNER: ['MANAGER', 'FRONT_DESK'],
  MANAGER: ['FRONT_DESK'],
  FRONT_DESK: [],
};
