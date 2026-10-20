import type { SignInMethod, StaffRole, StaffStatus, Tone } from "../types";

// Chip tones for roles and account states (Figma Status Chip: roles are
// informational, locked is a problem, invited is not-yet).
export const ROLE_META: Record<StaffRole, { label: string; tone: Tone }> = {
  owner: { label: "Owner", tone: "info" },
  manager: { label: "Manager", tone: "neutral" },
  "front-desk": { label: "Front Desk", tone: "neutral" },
};

export const STAFF_STATUS_META: Record<StaffStatus, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "success" },
  invited: { label: "Invited", tone: "warning" },
  locked: { label: "Locked", tone: "danger" },
};

export const SIGN_IN_METHOD_LABELS: Record<SignInMethod, string> = {
  password: "Email & password",
  google: "Google",
};

// "Kamala Silva" → "KS"
export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

// "21 Oct 2026, 10:24 AM" in Sri Lanka time.
export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Colombo",
  })
    .format(new Date(iso))
    .replace(/\b(am|pm)\b/, (m) => m.toUpperCase());
}
