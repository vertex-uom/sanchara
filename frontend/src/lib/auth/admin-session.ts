import "server-only";
import { cookies } from "next/headers";

// BFF session for the Platform Admin console: the API's opaque token lives only
// in this host-only, httpOnly cookie on the admin host. A browser-session
// cookie; the API's short admin TTL (30 min idle, 12 h max) decides the rest.
const SESSION_COOKIE = "__Host-sanchara_admin";

const COOKIE_OPTIONS = { httpOnly: true, secure: true, sameSite: "lax", path: "/" } as const;

export async function readAdminToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function setAdminSession(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, COOKIE_OPTIONS);
}

export async function clearAdminSession() {
  (await cookies()).delete({ name: SESSION_COOKIE, ...COOKIE_OPTIONS });
}

// Google sign-in state, checked on the callback (CSRF protection for OAuth).
// Lax still sends it on the top-level redirect back from Google.
const GOOGLE_STATE_COOKIE = "__Host-sanchara_admin_gstate";

export async function setAdminGoogleState(state: string) {
  (await cookies()).set(GOOGLE_STATE_COOKIE, state, { ...COOKIE_OPTIONS, maxAge: 10 * 60 });
}

export async function takeAdminGoogleState(): Promise<string | null> {
  const store = await cookies();
  const state = store.get(GOOGLE_STATE_COOKIE)?.value ?? null;
  store.delete({ name: GOOGLE_STATE_COOKIE, ...COOKIE_OPTIONS });
  return state;
}
