import type { StaffRole } from "@/lib/auth/staff";

export const ROLE_META: Record<StaffRole, { label: string; description: string }> = {
  owner: { label: "Owner", description: "Full access and billing" },
  manager: { label: "Manager", description: "Runs rooms, rates and reports" },
  "front-desk": { label: "Front Desk", description: "Handles reservations and payments" },
};

// Messages for ?error= after a role change or deactivation is refused.
export const STAFF_ERROR_MESSAGES = {
  FORBIDDEN: "You can't change this account.",
  LIMIT_REACHED: "Your plan's staff limit is reached. Upgrade the plan or deactivate an account first.",
  NOT_INVITED: "This account has already accepted its invite.",
  CONFLICT: "This account was changed meanwhile. Try again.",
  NOT_FOUND: "That staff account no longer exists.",
  FAILED: "That change couldn't be saved. Try again.",
} as const;

export type StaffErrorCode = keyof typeof STAFF_ERROR_MESSAGES;

export const STAFF_NOTICES = {
  invited: "Invite sent. They'll get an email with a link to set their password.",
  resent: "A new invite link was sent. The old link no longer works.",
} as const;

// Deactivate confirmation note when front-desk work changes hands.
export const FRONT_DESK_HANDOVER: Partial<Record<StaffRole, string>> = {
  manager: "Front-desk work moves to the Manager, because no other Front Desk account is active.",
  owner: "Front-desk work moves back to the Owner, because no Front Desk or Manager account will be active.",
};
