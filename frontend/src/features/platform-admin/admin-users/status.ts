import type { AdminAccountChangeKind, AdminAccountStatus, Tone } from "../types";

export const ADMIN_STATUS_META: Record<AdminAccountStatus, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "success" },
  invited: { label: "Invited", tone: "info" },
  deactivated: { label: "Deactivated", tone: "neutral" },
};

export const CHANGE_KIND_LABELS: Record<AdminAccountChangeKind, string> = {
  invited: "Invited",
  activated: "Activated",
  deactivated: "Deactivated",
  reactivated: "Reactivated",
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
