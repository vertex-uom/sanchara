import { redirect } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api-client/server";
import { signInPath, type StaffPortal } from "@/lib/auth/staff";
import { setStaffSession, takeStaffGoogleState } from "@/lib/auth/staff-session";

// Google redirects both portals here (BFF). The state must match the cookie set
// when the flow started; the API then exchanges the code, checks the account
// belongs to that portal and returns a session. The Back Office home decides
// where each role lands.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const expected = await takeStaffGoogleState();
  const failed = (reason: string) => `${signInPath(expected.portal)}?error=${reason}`;
  if (!code || !state || !expected.state || state !== expected.state) redirect(failed("google"));

  try {
    const result = await apiFetch<{ session: { token: string; rememberMe: boolean }; portal: StaffPortal }>("/v1/auth/staff/google/callback", {
      method: "POST",
      body: { code, state },
    });
    await setStaffSession(result.session.token, result.session.rememberMe, result.portal);
  } catch (error) {
    redirect(failed(error instanceof ApiError && error.code === "STAFF_ACCOUNT_UNAVAILABLE" ? "no-account" : "google"));
  }
  redirect("/");
}
