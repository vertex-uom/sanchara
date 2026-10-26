"use server";

import { redirect } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api-client/server";
import { clearAdminSession, readAdminToken, setAdminSession } from "@/lib/auth/admin-session";
import { ADMIN_SIGN_IN_PATH } from "@/lib/auth/admin";
import { adminSignInSchema, type AdminSignInState } from "./schema";

function waitMessage(seconds: number | null) {
  const minutes = Math.max(1, Math.ceil((seconds ?? 60) / 60));
  return `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

export async function signInAdmin(_previous: AdminSignInState, formData: FormData): Promise<AdminSignInState> {
  const email = String(formData.get("email") ?? "");
  const parsed = adminSignInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: AdminSignInState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if ((key === "email" || key === "password") && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors, email };
  }

  try {
    const { session } = await apiFetch<{ session: { token: string } }>("/v1/auth/admin/login", { method: "POST", body: parsed.data });
    await setAdminSession(session.token);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.status === 429) return { message: waitMessage(error.retryAfter), email };
    // Same message for every failure: never reveal whether an admin exists.
    if (error.code === "INVALID_CREDENTIALS" || error.status === 400) return { message: "Email or password is incorrect.", email };
    return { message: "Something went wrong. Please try again.", email };
  }
  redirect("/");
}

// Ends the session on the API (idempotent) and forgets the cookie.
export async function signOutAdmin(): Promise<void> {
  const token = await readAdminToken();
  if (token) await apiFetch("/v1/auth/admin/logout", { method: "POST", token }).catch(() => undefined);
  await clearAdminSession();
  redirect(ADMIN_SIGN_IN_PATH);
}
