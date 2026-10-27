"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { propertyPath } from "@/lib/routes/backoffice";
import { STAFF_VIEW_COOKIE, type StaffView } from "./staff";

const PROPERTY_ID = /^[a-z0-9_-]{1,64}$/;

// TEMPORARY dev switch between the Owner and Manager views (see staff.ts).
// Lands on the property overview, since the new role may not see the current page.
export async function switchStaffViewAction(view: StaffView, propertyId: string) {
  const store = await cookies();
  if (view === "manager") store.set(STAFF_VIEW_COOKIE, "manager", { path: "/", sameSite: "lax", httpOnly: true });
  else store.delete(STAFF_VIEW_COOKIE);
  redirect(PROPERTY_ID.test(propertyId) ? propertyPath(propertyId) : "/");
}
