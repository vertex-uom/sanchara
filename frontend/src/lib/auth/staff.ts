// Signed-in Back Office user. Role-based menus and capabilities are added
// later from /me; for now the Back Office renders the Owner view.
export type StaffRole = "owner" | "manager" | "front-desk";

export type StaffUser = {
  id: string;
  fullName: string;
  firstName: string;
  role: StaffRole;
  roleLabel: string;
};

// TEMPORARY fixture. Replace the body with the /me API call once sessions
// exist; the return type stays the same.
export async function getCurrentStaff(): Promise<StaffUser> {
  return {
    id: "staff_owner_1",
    fullName: "Nisal Rathnaka",
    firstName: "Nisal",
    role: "owner",
    roleLabel: "Owner",
  };
}
