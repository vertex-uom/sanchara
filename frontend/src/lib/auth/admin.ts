import "server-only";
import { redirect } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api-client/server";
import { readAdminToken } from "./admin-session";

// Signed-in WEMIXT platform-team member. This is the Platform Admin console's
// own identity type; it is separate from Back Office staff (lib/auth/staff.ts)
// and never a Guest, Owner, Manager or Front Desk user.
export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  roleLabel: "Platform Admin";
};

type AdminProfile = { id: string; fullName: string; email: string };

// Admin sign-in page, on the admin host.
export const ADMIN_SIGN_IN_PATH = "/sign-in";

// The signed-in admin, or null. A stale cookie (session ended on the server)
// reads as signed out. Two-step verification is not enforced yet (API TODO).
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const token = await readAdminToken();
  if (!token) return null;
  try {
    const me = await apiFetch<{ audience: string; admin?: AdminProfile }>("/v1/me", { token });
    if (me.audience !== "admin" || !me.admin) return null;
    return { ...me.admin, roleLabel: "Platform Admin" };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

// For every console page: signed-out visitors go to the admin sign-in.
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect(ADMIN_SIGN_IN_PATH);
  return admin;
}

type AdminFetchOptions = { method?: "GET" | "POST"; body?: unknown };

// apiFetch with the admin session. A missing or expired session sends the
// admin to sign-in (redirect works in Server Components and Server Actions).
export async function adminFetch<T>(path: string, options: AdminFetchOptions = {}): Promise<T> {
  const token = await readAdminToken();
  if (!token) redirect(ADMIN_SIGN_IN_PATH);
  try {
    return await apiFetch<T>(path, { ...options, token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect(ADMIN_SIGN_IN_PATH);
    throw error;
  }
}
