import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api-client/server";
import { STAFF_ROLE_LABELS, STAFF_VIEW_COOKIE, signInPath, viewableRoles, type StaffCompany, type StaffRole, type StaffUser } from "./staff";
import { readStaffPortal, readStaffToken } from "./staff-session";

// What the API returns for a staff session (GET /v1/me).
type StaffMe = {
  audience: "staff";
  staff: { id: string; fullName: string; email: string; role: StaffRole; status: string };
  company: StaffCompany;
};

// The signed-in staff member, or null. A stale cookie (session ended on the
// server, account deactivated) reads as signed out.
async function fetchStaff(): Promise<StaffMe | null> {
  const token = await readStaffToken();
  if (!token) return null;
  try {
    const me = await apiFetch<{ audience: string } & Partial<StaffMe>>("/v1/me", { token });
    return me.audience === "staff" && me.staff && me.company ? (me as StaffMe) : null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

// For every Back Office page and action: signed-out visitors go to the sign-in
// page of the portal they last used. Once per request. Reads cookies, so call
// it inside <Suspense>.
export const getCurrentStaff = cache(async (): Promise<StaffUser> => {
  const me = await fetchStaff();
  if (!me) redirect(signInPath(await readStaffPortal()));

  const { id, fullName, email, role: accountRole } = me.staff;
  const view = (await cookies()).get(STAFF_VIEW_COOKIE)?.value;
  const role = viewableRoles(accountRole).find((item) => item === view) ?? accountRole;
  return {
    id,
    fullName,
    firstName: fullName.trim().split(/\s+/)[0] ?? fullName,
    email,
    role,
    roleLabel: STAFF_ROLE_LABELS[role],
    accountRole,
    company: me.company,
  };
});
