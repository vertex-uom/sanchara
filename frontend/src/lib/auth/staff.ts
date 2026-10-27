// Signed-in Back Office user. Comes from /me later; for now a fixture Owner
// or Manager (dev switch below). What each role sees is in permissions.ts.
export type StaffRole = "owner" | "manager" | "front-desk";

export const STAFF_ROLES: readonly StaffRole[] = ["owner", "manager", "front-desk"];

export type StaffUser = {
  id: string;
  fullName: string;
  firstName: string;
  role: StaffRole;
  roleLabel: string;
};

// TEMPORARY dev switch: the user menu lets the Owner view the Back Office as a
// Manager (see switchStaffViewAction). Removed with the fixtures below.
export const STAFF_VIEW_COOKIE = "sanchara_staff_view";

// Roles the dev switch can show.
export type StaffView = "owner" | "manager";

const FIXTURES: Record<StaffView, StaffUser> = {
  owner: { id: "staff_owner_1", fullName: "Nisal Rathnaka", firstName: "Nisal", role: "owner", roleLabel: "Owner" },
  manager: { id: "staff_manager_1", fullName: "Kasun Fernando", firstName: "Kasun", role: "manager", roleLabel: "Manager" },
};

// TEMPORARY fixture. Replace the body with the /me API call once sessions
// exist; the return type stays the same.
export async function getCurrentStaff(): Promise<StaffUser> {
  // Imported here so client components can still use STAFF_ROLES from this file.
  const { cookies } = await import("next/headers");
  const view = (await cookies()).get(STAFF_VIEW_COOKIE)?.value;
  return view === "manager" ? FIXTURES.manager : FIXTURES.owner;
}
