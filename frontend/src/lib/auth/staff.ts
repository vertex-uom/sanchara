// Signed-in Back Office user. Comes from /me later; for now a fixture Owner
// who can view the Back Office as a lower role (dev switch below). What each
// role sees is in permissions.ts.
export type StaffRole = "owner" | "manager" | "front-desk";

// Highest role first.
export const STAFF_ROLES: readonly StaffRole[] = ["owner", "manager", "front-desk"];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = { owner: "Owner", manager: "Manager", "front-desk": "Front Desk" };

export type StaffUser = {
  id: string;
  fullName: string;
  firstName: string;
  // The role the Back Office is shown as; accountRole when not switched.
  role: StaffRole;
  roleLabel: string;
  // The account's own role. The view can only switch to this role or below it.
  accountRole: StaffRole;
};

// TEMPORARY dev switch: the user menu changes the role the signed-in user
// views the Back Office as (see switchStaffViewAction). The profile stays the
// same; only the role changes.
export const STAFF_VIEW_COOKIE = "sanchara_staff_view";

// Roles this account may view as: its own role and every role below it.
export function viewableRoles(accountRole: StaffRole): StaffRole[] {
  return STAFF_ROLES.slice(STAFF_ROLES.indexOf(accountRole));
}

const ACCOUNT = { id: "staff_owner_1", fullName: "Nisal Rathnaka", firstName: "Nisal", accountRole: "owner" } as const;

// TEMPORARY fixture. Replace the body with the /me API call once sessions
// exist; the return type stays the same.
export async function getCurrentStaff(): Promise<StaffUser> {
  // Imported here so client components can still use STAFF_ROLES from this file.
  const { cookies } = await import("next/headers");
  const view = (await cookies()).get(STAFF_VIEW_COOKIE)?.value;
  const role = viewableRoles(ACCOUNT.accountRole).find((item) => item === view) ?? ACCOUNT.accountRole;
  return { ...ACCOUNT, role, roleLabel: STAFF_ROLE_LABELS[role] };
}
