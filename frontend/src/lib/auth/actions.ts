"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api-client/server";
import { propertyPath } from "@/lib/routes/backoffice";
import { getCurrentStaff } from "./current-staff";
import { signInPath, STAFF_VIEW_COOKIE, viewableRoles, type StaffRole } from "./staff";
import { clearStaffSession, readStaffPortal, readStaffToken } from "./staff-session";

const PROPERTY_ID = /^[a-z0-9_-]{1,64}$/;

// TEMPORARY dev switch of the role the Back Office is viewed as (see staff.ts).
// Only the account's own role or a lower one is accepted. Lands on the
// property overview, since the new role may not see the current page.
export async function switchStaffViewAction(role: StaffRole, propertyId: string) {
  const { accountRole } = await getCurrentStaff();
  if (viewableRoles(accountRole).includes(role)) {
    const store = await cookies();
    if (role === accountRole) store.delete(STAFF_VIEW_COOKIE);
    else store.set(STAFF_VIEW_COOKIE, role, { path: "/", sameSite: "lax", httpOnly: true });
  }
  redirect(PROPERTY_ID.test(propertyId) ? propertyPath(propertyId) : "/");
}

// Ends the session on the API (idempotent), forgets the cookie and returns to
// the sign-in page of the account's portal.
export async function signOutStaffAction(): Promise<void> {
  const token = await readStaffToken();
  if (token) await apiFetch("/v1/auth/staff/logout", { method: "POST", token }).catch(() => undefined);
  await clearStaffSession();
  redirect(`${signInPath(await readStaffPortal())}?signed-out=1`);
}
