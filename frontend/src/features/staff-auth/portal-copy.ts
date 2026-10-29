import type { StaffPortal } from "@/lib/auth/staff";

// Wording that differs between the owner and the staff sign-in portals.
export const PORTAL_COPY: Record<
  StaffPortal,
  { badge: string; signInTitle: string; signInDescription: string; noAccount: string; newInviteFrom: string; googleNoAccount: string }
> = {
  owner: {
    badge: "Owner portal",
    signInTitle: "Owner sign in",
    signInDescription: "Manage your company, properties, staff and subscription.",
    noAccount: "Owner accounts are set up by the Sanchara team.",
    newInviteFrom: "the Sanchara team",
    googleNoAccount: "No active Owner account uses this Google account. Use the Google account of your Owner email, or sign in with your password.",
  },
  staff: {
    badge: "Staff portal",
    signInTitle: "Staff sign in",
    signInDescription: "For Managers and Front Desk.",
    noAccount: "No account yet? Ask your Owner or Manager for an invite.",
    newInviteFrom: "your Owner or Manager",
    googleNoAccount: "No active staff account uses this Google account. Ask your Owner or Manager for an invite, or sign in with your password.",
  },
};
