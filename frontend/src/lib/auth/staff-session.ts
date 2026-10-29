import "server-only";
import { cookies } from "next/headers";
import { STAFF_VIEW_COOKIE, type StaffPortal } from "./staff";

// BFF session for the Back Office: the API's opaque token lives only in this
// host-only, httpOnly cookie on the Back Office host.
const SESSION_COOKIE = "__Host-sanchara_staff";
// The portal of the last account signed in on this browser, so a signed-out
// visit goes to the right sign-in page. Staff never get sent to the owner one.
const PORTAL_COOKIE = "__Host-sanchara_staff_portal";
const GOOGLE_STATE_COOKIE = "__Host-sanchara_staff_gstate";

const COOKIE_OPTIONS = { httpOnly: true, secure: true, sameSite: "lax", path: "/" } as const;
const REMEMBER_MAX_AGE = 14 * 24 * 60 * 60;
const PORTAL_MAX_AGE = 365 * 24 * 60 * 60;

export async function readStaffToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

// Remember me: persistent cookie. Otherwise a browser-session cookie. The API's
// own TTL (12 h idle / 14 days remembered, 30 days at most) still decides.
// A new sign-in starts in the account's own role view.
export async function setStaffSession(token: string, rememberMe: boolean, portal: StaffPortal) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, { ...COOKIE_OPTIONS, ...(rememberMe ? { maxAge: REMEMBER_MAX_AGE } : {}) });
  store.set(PORTAL_COOKIE, portal, { ...COOKIE_OPTIONS, maxAge: PORTAL_MAX_AGE });
  store.delete(STAFF_VIEW_COOKIE);
}

// The portal cookie stays, so the next sign-in page is the right one.
export async function clearStaffSession() {
  const store = await cookies();
  store.delete({ name: SESSION_COOKIE, ...COOKIE_OPTIONS });
  store.delete(STAFF_VIEW_COOKIE);
}

export async function readStaffPortal(): Promise<StaffPortal> {
  return (await cookies()).get(PORTAL_COOKIE)?.value === "owner" ? "owner" : "staff";
}

// Google sign-in state, checked on the callback (CSRF protection for OAuth),
// with the portal it started from so failures go back to that page.
export async function setStaffGoogleState(state: string, portal: StaffPortal) {
  (await cookies()).set(GOOGLE_STATE_COOKIE, `${portal}.${state}`, { ...COOKIE_OPTIONS, maxAge: 10 * 60 });
}

export async function takeStaffGoogleState(): Promise<{ state: string | null; portal: StaffPortal }> {
  const store = await cookies();
  const value = store.get(GOOGLE_STATE_COOKIE)?.value ?? "";
  store.delete({ name: GOOGLE_STATE_COOKIE, ...COOKIE_OPTIONS });
  const dot = value.indexOf(".");
  const portal = value.slice(0, dot) === "owner" ? "owner" : "staff";
  return { state: dot > 0 ? value.slice(dot + 1) || null : null, portal };
}
