import { redirect } from "next/navigation";

// Signed-in WEMIXT platform-team member. This is the Platform Admin console's
// own identity type; it is separate from Back Office staff (lib/auth/staff.ts)
// and never a Guest, Owner, Manager or Front Desk user.
export type AdminUser = {
  id: string;
  fullName: string;
  roleLabel: "Platform Admin";
};

// TEMPORARY guard. There is no admin session yet, so in development the shell
// renders for a fixture Platform Admin, and in production nobody passes.
// Replace the body with the admin /me session check (403 for non-admins) once
// admin sign-in exists; the return type stays the same. No role or permission
// logic belongs here beyond this stub.
export async function requireAdmin(): Promise<AdminUser> {
  if (process.env.NODE_ENV === "production") {
    redirect("/sign-in");
  }
  return {
    id: "admin_fixture_1",
    fullName: "Admin User",
    roleLabel: "Platform Admin",
  };
}
