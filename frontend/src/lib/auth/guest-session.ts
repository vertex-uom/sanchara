import "server-only";
import { cookies } from "next/headers";

// BFF session: the API's opaque token lives only in this cookie. "__Host-"
// forces Secure, Path=/ and no Domain, so it never leaves this host (browsers
// treat http://localhost and *.localhost as secure, so it works in dev too).
const SESSION_COOKIE = "__Host-sanchara_guest";
const REMEMBER_MAX_AGE = 30 * 24 * 60 * 60;

export async function readGuestToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

// Remember me: persistent cookie. Otherwise a browser-session cookie. The API's
// own TTL (24h / 30 days, sliding) still decides when the session ends.
export async function setGuestSession(token: string, rememberMe: boolean) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    ...(rememberMe ? { maxAge: REMEMBER_MAX_AGE } : {}),
  });
}

export async function clearGuestSession() {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/", secure: true, httpOnly: true, sameSite: "lax" });
}

// Google sign-in state, checked on the callback (CSRF protection for OAuth).
const GOOGLE_STATE_COOKIE = "__Host-sanchara_gstate";

export async function setGoogleState(state: string) {
  (await cookies()).set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    // Lax still sends it on the top-level redirect back from Google.
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
}

export async function takeGoogleState(): Promise<string | null> {
  const store = await cookies();
  const state = store.get(GOOGLE_STATE_COOKIE)?.value ?? null;
  store.delete({ name: GOOGLE_STATE_COOKIE, path: "/", secure: true, httpOnly: true, sameSite: "lax" });
  return state;
}
