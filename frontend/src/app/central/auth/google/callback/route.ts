import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api-client/server";
import { setGuestSession, takeGoogleState } from "@/lib/auth/guest-session";
import { safeReturnTo } from "@/lib/auth/return-to";

type CallbackResponse = { session: { token: string; rememberMe: boolean }; returnTo: string | null };

const FAILED = "/sign-in?error=google";

// Google redirects here (BFF). The state must match the cookie set when the
// flow started; the API then exchanges the code and returns a session.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const expected = await takeGoogleState();
  if (!code || !state || !expected || state !== expected) redirect(FAILED);

  let returnTo: string | null;
  try {
    const result = await apiFetch<CallbackResponse>("/v1/auth/guest/google/callback", {
      method: "POST",
      body: { code, state },
    });
    await setGuestSession(result.session.token, false);
    returnTo = result.returnTo;
  } catch {
    redirect(FAILED);
  }
  redirect(safeReturnTo(returnTo) ?? "/");
}
