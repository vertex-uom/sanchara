import "server-only";
import { cookies } from "next/headers";
import { adminFetch } from "@/lib/auth/admin";

// The console-wide province filter from the header. Kept in a cookie so every
// tab sees the same choice; null = the whole country.
export const PROVINCE_COOKIE = "__Host-sanchara_admin_province";

export type ProvinceOption = { id: number; name: string; companies: number };

export async function readProvinceFilter(): Promise<number | null> {
  const value = Number((await cookies()).get(PROVINCE_COOKIE)?.value);
  return Number.isInteger(value) && value > 0 ? value : null;
}

// GET /v1/admin/overview/provinces: every province, alphabetical, with how many
// companies have a property there.
export function listProvinces(): Promise<ProvinceOption[]> {
  return adminFetch<ProvinceOption[]>("/v1/admin/overview/provinces");
}

// "Uva" → "Uva Province"
export const provinceLabel = (name: string) => `${name} Province`;
