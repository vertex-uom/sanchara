import type { SignInMethod, StaffRole, StaffStatus, Tone } from "../types";

// Chip tones for roles and account states (Figma Status Chip: roles are
// informational, locked is a problem, invited is not-yet).
export const ROLE_META: Record<StaffRole, { label: string; tone: Tone }> = {
  owner: { label: "Owner", tone: "info" },
  manager: { label: "Manager", tone: "neutral" },
  "front-desk": { label: "Front Desk", tone: "neutral" },
};

export const STAFF_STATUS_META: Record<StaffStatus, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "success" },
  invited: { label: "Invited", tone: "warning" },
  locked: { label: "Locked", tone: "danger" },
};

export const SIGN_IN_METHOD_LABELS: Record<SignInMethod, string> = {
  password: "Email & password",
  google: "Google",
};

