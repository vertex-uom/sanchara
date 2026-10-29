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

type StaffFetchOptions = { method?: "GET" | "POST" | "PUT"; body?: unknown };

// apiFetch with the staff session. A missing or ended session sends the user
// to sign-in (redirect works in Server Components and Server Actions).
export async function staffFetch<T>(path: string, options: StaffFetchOptions = {}): Promise<T> {
  const token = await readStaffToken();
  if (!token) redirect(signInPath(await readStaffPortal()));
  try {
    return await apiFetch<T>(path, { ...options, token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect(signInPath(await readStaffPortal()));
    // Suspended meanwhile: the Back Office home sends each role to its notice.
    if (error instanceof ApiError && error.code === "COMPANY_SUSPENDED") redirect("/");
    throw error;
  }
}

export function isSuspended(company: StaffCompany) {
  return company.status === "suspended-by-admin" || company.status === "suspended-non-payment";
}

// Where a suspended company's staff go: the Owner to billing, everyone else to a notice.
export function suspendedPath(user: Pick<StaffUser, "accountRole">) {
  return user.accountRole === "owner" ? "/billing" : "/suspended";
}

// The signed-in staff member whatever the company's status (for /billing and
// /suspended). Signed-out visitors go to the sign-in page of the portal they
// last used. Once per request. Reads cookies, so call it inside <Suspense>.
export const getSignedInStaff = cache(async (): Promise<StaffUser> => {
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

// For every other Back Office page and action: as getSignedInStaff, and a
// suspended company's staff are sent to billing (Owner) or the notice.
export const getCurrentStaff = cache(async (): Promise<StaffUser> => {
  const user = await getSignedInStaff();
  if (isSuspended(user.company)) redirect(suspendedPath(user));
  return user;
});
