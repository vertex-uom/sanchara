import type { StaffRole } from "@/lib/auth/staff";

// Invited: the invite hasn't been accepted yet.
export type StaffStatus = "invited" | "active" | "inactive";

export type StaffMember = {
  id: string;
  fullName: string;
  email: string;
  role: StaffRole;
  status: StaffStatus;
  // Invited accounts: when the current link expires (null: expired, resend it).
  inviteExpiresAt: string | null;
  // The API lets the signed-in user change this account (never the Owner, never themselves).
  manageable: boolean;
  you: boolean;
};

export type StaffList = {
  members: StaffMember[];
  // Active and invited accounts, counted by the API; limit null = no limit.
  seats: { used: number; limit: number | null };
};

// Who takes over front-desk work if this account is deactivated; null when nothing changes.
export type DeactivationPreview = { frontDeskMovesTo: StaffRole | null };
