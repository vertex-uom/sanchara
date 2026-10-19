import type { StaffRole, StaffUser } from "./staff";

// What each role may see in the Back Office. UI visibility only; the API
// enforces access. Later derived from /me (see docs/frontend-architecture.md).
export type Capability = "reports.read";

const ROLE_CAPABILITIES: Record<StaffRole, readonly Capability[]> = {
  owner: ["reports.read"],
  manager: ["reports.read"],
  "front-desk": [],
};

export function can(user: Pick<StaffUser, "role">, capability: Capability) {
  return ROLE_CAPABILITIES[user.role].includes(capability);
}
