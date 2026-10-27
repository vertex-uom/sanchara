import type { AdminAccountChangeKind, AdminAccountStatus, Tone } from "../types";

export const ADMIN_STATUS_META: Record<AdminAccountStatus, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "success" },
  invited: { label: "Invited", tone: "info" },
  deactivated: { label: "Deactivated", tone: "neutral" },
};

export const CHANGE_KIND_LABELS: Record<AdminAccountChangeKind, string> = {
  added: "Added",
  invited: "Invited",
  activated: "Activated",
  deactivated: "Deactivated",
  reactivated: "Reactivated",
};

