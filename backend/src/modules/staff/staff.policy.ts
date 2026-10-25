import type { StaffRole } from '../../generated/prisma/client.js';

// Invite links stay valid for 72 hours; sending a new one cancels the old one.
export const INVITE_TOKEN_TTL = 72 * 60 * 60;

// Back Office page that handles the invite link.
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
