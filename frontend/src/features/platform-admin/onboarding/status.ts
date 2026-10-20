import type { ApplicationStatus, DocumentStatus, Tone } from "../types";

// Chip labels and tones for application and document statuses (Figma Status
// Chip: info for new, warning while something is pending, success/danger for
// decisions).
export const APPLICATION_STATUS_META: Record<ApplicationStatus, { label: string; tone: Tone }> = {
  submitted: { label: "Submitted", tone: "info" },
  resubmitted: { label: "Resubmitted", tone: "info" },
  "in-review": { label: "In review", tone: "warning" },
  "more-info": { label: "More info", tone: "warning" },
  "on-hold": { label: "On hold", tone: "neutral" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

export const DOCUMENT_STATUS_META: Record<DocumentStatus, { label: string; tone: Tone }> = {
  verified: { label: "Verified", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  expired: { label: "Expired", tone: "danger" },
  rejected: { label: "Rejected", tone: "danger" },
};

// "<1d", "1d", "12d" — whole days since submission.
export function formatAge(days: number) {
  return days < 1 ? "<1d" : `${Math.floor(days)}d`;
}
