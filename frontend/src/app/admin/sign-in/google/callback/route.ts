import { redirect } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api-client/server";
import { ADMIN_SIGN_IN_PATH } from "@/lib/auth/admin";
import { setAdminSession, takeAdminGoogleState } from "@/lib/auth/admin-session";

// Google redirects admins here (BFF). The state must match the cookie set when
// the flow started; the API then exchanges the code and returns a session.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const expected = await takeAdminGoogleState();
  if (!code || !state || !expected || state !== expected) redirect(`${ADMIN_SIGN_IN_PATH}?error=google`);

  try {
    const { session } = await apiFetch<{ session: { token: string } }>("/v1/auth/admin/google/callback", { method: "POST", body: { code, state } });
    await setAdminSession(session.token);
  } catch (error) {
    const reason = error instanceof ApiError && error.code === "ADMIN_ACCOUNT_UNAVAILABLE" ? "no-account" : "google";
    redirect(`${ADMIN_SIGN_IN_PATH}?error=${reason}`);
  }
  redirect("/");
}
