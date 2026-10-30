import type { StaffRole, StaffUser } from "./staff";

export type Capability =
  | "reports.read"
  | "staff.read"
  | "audit.read"
  | "subscription.read"
  | "subscription.manage"
  | "settings.read"
  | "settings.manage"
  | "rates.manage"
  | "packages.manage"
  | "blocks.manage"
  | "rooms.manage"
  | "website.manage";

// Manager follows the Manager dashboard design: no Reports, Audit Trail or
// Property Settings; the plan is visible but only the Owner changes it.
const MANAGER_VIEW: readonly Capability[] = ["staff.read", "subscription.read"];

// Rates, seasons and packages are Management: Owner and Manager, never Front Desk.
// TODO(confirm): which roles may create and remove date blocks, and add or
// edit room types and units; for now Owner and Manager, not Front Desk.
// Website Builder: Owner and Manager (as the API's website assistance), not Front Desk.
const ROLE_CAPABILITIES: Record<StaffRole, readonly Capability[]> = {
  owner: [
    "reports.read",
    "staff.read",
    "audit.read",
    "subscription.read",
    "subscription.manage",
    "settings.read",
    "settings.manage",
    "rates.manage",
    "packages.manage",
    "blocks.manage",
    "rooms.manage",
    "website.manage",
  ],
  manager: [...MANAGER_VIEW, "rates.manage", "packages.manage", "blocks.manage", "rooms.manage", "website.manage"],
  // TODO(design): Front Desk shows the Manager layout until its design arrives.
  "front-desk": MANAGER_VIEW,
};

// Roles each role may give to staff accounts (Owner manages everyone,
// Manager manages Front Desk).
// A company has one Owner, so no one is given the Owner role.
const ASSIGNABLE_ROLES: Record<StaffRole, readonly StaffRole[]> = {
  owner: ["manager", "front-desk"],
  manager: ["front-desk"],
  "front-desk": [],
};

export function can(user: Pick<StaffUser, "role">, capability: Capability) {
  return ROLE_CAPABILITIES[user.role].includes(capability);
}

export function assignableRoles(user: Pick<StaffUser, "role">) {
  return ASSIGNABLE_ROLES[user.role];
}

// Roles a new account may be created with (Managers and Front Desk).
export function creatableRoles(user: Pick<StaffUser, "role">) {
  return assignableRoles(user);
}

// TODO(confirm): v8 has not decided Manager scope; for now a Manager sees all
// staff read-only and manages only accounts whose role they may assign.
// Nobody changes or deactivates their own account.
export function canManageStaff(user: Pick<StaffUser, "id" | "role">, target: { id: string; role: StaffRole }) {
  return target.id !== user.id && assignableRoles(user).includes(target.role);
}
