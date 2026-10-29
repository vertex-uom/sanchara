import "server-only";
import { cookies } from "next/headers";

// BFF session for Back Office staff: the API's opaque staff token lives only in
// this host-only, httpOnly cookie on the Back Office host. Set by staff sign-in
// (not built on the frontend yet); until then there is no staff token.
const SESSION_COOKIE = "__Host-sanchara_staff";

export async function readStaffToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}
