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
  | "rooms.manage";

// Manager follows the Manager dashboard design: no Reports, Audit Trail or
// Property Settings; the plan is visible but only the Owner changes it.
const MANAGER_VIEW: readonly Capability[] = ["staff.read", "subscription.read"];

// Rates, seasons and packages are Management: Owner and Manager, never Front Desk.
// TODO(confirm): which roles may create and remove date blocks, and add or
// edit room types and units; for now Owner and Manager, not Front Desk.
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
  ],
  manager: [...MANAGER_VIEW, "rates.manage", "packages.manage", "blocks.manage", "rooms.manage"],
  // TODO(design): Front Desk shows the Manager layout until its design arrives.
  "front-desk": MANAGER_VIEW,
};

// Roles each role may give to staff accounts (Owner manages everyone,
// Manager manages Front Desk).
const ASSIGNABLE_ROLES: Record<StaffRole, readonly StaffRole[]> = {
  owner: ["owner", "manager", "front-desk"],
  manager: ["front-desk"],
  "front-desk": [],
};

export function can(user: Pick<StaffUser, "role">, capability: Capability) {
  return ROLE_CAPABILITIES[user.role].includes(capability);
}

export function assignableRoles(user: Pick<StaffUser, "role">) {
  return ASSIGNABLE_ROLES[user.role];
}

// Roles a new account may be created with: never Owner (Add staff adds
// Managers and Front Desk only).
export function creatableRoles(user: Pick<StaffUser, "role">) {
  return assignableRoles(user).filter((role) => role !== "owner");
}

// TODO(confirm): v8 has not decided Manager scope; for now a Manager sees all
// staff read-only and manages only accounts whose role they may assign.
// Nobody changes or deactivates their own account.
export function canManageStaff(user: Pick<StaffUser, "id" | "role">, target: { id: string; role: StaffRole }) {
  return target.id !== user.id && assignableRoles(user).includes(target.role);
}
