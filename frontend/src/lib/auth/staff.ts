// Back Office roles, the signed-in user's shape and the two sign-in portals.
// Safe for client components; the session itself is read in current-staff.ts.
// What each role sees is in permissions.ts.
export type StaffRole = "owner" | "manager" | "front-desk";

// Highest role first.
export const STAFF_ROLES: readonly StaffRole[] = ["owner", "manager", "front-desk"];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = { owner: "Owner", manager: "Manager", "front-desk": "Front Desk" };

export type StaffCompany = {
  id: string;
  name: string;
  subdomain: string;
  status: "pending-setup" | "active" | "suspended-non-payment" | "suspended-by-admin";
};

export type StaffUser = {
  id: string;
  fullName: string;
  firstName: string;
  email: string;
  // The role the Back Office is shown as; accountRole when not switched.
  role: StaffRole;
  roleLabel: string;
  // The account's own role. The view can only switch to this role or below it.
  accountRole: StaffRole;
  company: StaffCompany;
};

// TEMPORARY dev switch: the user menu changes the role the signed-in user
// views the Back Office as (see switchStaffViewAction). The profile stays the
// same; only the role changes.
export const STAFF_VIEW_COOKIE = "sanchara_staff_view";

// Roles this account may view as: its own role and every role below it.
export function viewableRoles(accountRole: StaffRole): StaffRole[] {
  return STAFF_ROLES.slice(STAFF_ROLES.indexOf(accountRole));
}

// Owners sign in on the owner portal (/owner/…); Managers and Front Desk on
// the staff portal (/…). The API refuses a sign-in from the other portal, and
// staff pages never link to the owner portal.
export type StaffPortal = "owner" | "staff";

export function portalOf(role: StaffRole): StaffPortal {
  return role === "owner" ? "owner" : "staff";
}

export function portalPath(portal: StaffPortal, path: string) {
  return portal === "owner" ? `/owner${path}` : path;
}

export function signInPath(portal: StaffPortal) {
  return portalPath(portal, "/sign-in");
}
