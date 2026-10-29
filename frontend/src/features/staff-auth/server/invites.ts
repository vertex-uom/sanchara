import "server-only";
import { ApiError, apiFetch } from "@/lib/api-client/server";
import type { StaffPortal, StaffRole } from "@/lib/auth/staff";
import { TOKEN_PATTERN } from "../schema";

// Who an invite is for, shown before the person sets a password.
export type InvitePreview = { fullName: string; email: string; role: StaffRole; companyName: string };

// Null when the link is malformed, used, expired or opened in the wrong portal.
export async function checkInvite(token: string, portal: StaffPortal): Promise<InvitePreview | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  try {
    const { invite } = await apiFetch<{ invite: InvitePreview }>("/v1/auth/staff/invite/check", { method: "POST", body: { token, portal } });
    return invite;
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) return null;
    throw error;
  }
}
