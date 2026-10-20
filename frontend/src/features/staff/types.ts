import type { StaffRole } from "@/lib/auth/staff";

export type StaffStatus = "active" | "inactive";

export type StaffMember = {
  id: string;
  fullName: string;
  email: string;
  role: StaffRole;
  status: StaffStatus;
  // The API refuses to deactivate the last active Owner or give them another role.
  lastActiveOwner: boolean;
};

export type StaffList = {
  members: StaffMember[];
  // Seats on the company's plan, counted by the API.
  seats: { used: number; limit: number };
};

// Who takes over front-desk work if this account is deactivated; null when nothing changes.
export type DeactivationPreview = { frontDeskMovesTo: StaffRole | null };
