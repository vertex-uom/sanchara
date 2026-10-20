import "server-only";
import { redirect } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api-client/server";
import { readGuestToken } from "./guest-session";
import { withReturnTo } from "./return-to";

// What the API returns for a guest (GET /v1/me).
export type Guest = {
  id: string;
  fullName: string;
  email: string;
  mobile: string | null;
  emailVerified: boolean;
  createdAt: string;
};

// The signed-in guest, or null. Reads the cookie, so call it inside <Suspense>.
// A stale cookie (session ended on the server) just reads as signed out.
export async function getCurrentGuest(): Promise<Guest | null> {
  const token = await readGuestToken();
  if (!token) return null;
  try {
    const { guest } = await apiFetch<{ audience: "guest"; guest: Guest }>("/v1/me", { token });
    return guest;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

// For guest-only pages: sends signed-out visitors to sign-in, then back here.
export async function requireGuest(returnTo: string): Promise<Guest> {
  const guest = await getCurrentGuest();
  if (!guest) redirect(withReturnTo("/sign-in", returnTo));
  return guest;
}
