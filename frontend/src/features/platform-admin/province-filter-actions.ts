"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { PROVINCE_COOKIE } from "./server/province-filter";

// Remembers the header's province choice (null clears it) and re-renders the
// current page with it.
export async function setProvinceFilter(provinceId: number | null): Promise<void> {
  await requireAdmin();
  const store = await cookies();
  if (provinceId === null) {
    store.delete({ name: PROVINCE_COOKIE, path: "/", secure: true, httpOnly: true, sameSite: "lax" });
  } else if (Number.isInteger(provinceId) && provinceId > 0) {
    store.set(PROVINCE_COOKIE, String(provinceId), { path: "/", secure: true, httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  }
  refresh();
}
