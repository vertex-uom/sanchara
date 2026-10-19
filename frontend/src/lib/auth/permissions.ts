import type { StaffRole, StaffUser } from "./staff";

// What each role may see in the Back Office. UI visibility only; the API
// enforces access. Later derived from /me (see docs/frontend-architecture.md).
export type Capability = "reports.read" | "staff.read";

const ROLE_CAPABILITIES: Record<StaffRole, readonly Capability[]> = {
  owner: ["reports.read", "staff.read"],
  manager: ["reports.read", "staff.read"],
  "front-desk": [],
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

// TODO(confirm): v8 has not decided Manager scope; for now a Manager sees all
// staff read-only and manages only accounts whose role they may assign.
// Nobody changes or deactivates their own account.
export function canManageStaff(user: Pick<StaffUser, "id" | "role">, target: { id: string; role: StaffRole }) {
  return target.id !== user.id && assignableRoles(user).includes(target.role);
}
