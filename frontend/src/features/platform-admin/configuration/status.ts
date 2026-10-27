import type { CustomDomainStatus, Tone } from "../types";

export { formatDateTime } from "../accounts/status";

// Chip tones for custom-domain checks (Figma Status Chip).
export const CUSTOM_DOMAIN_STATUS_META: Record<CustomDomainStatus, { label: string; tone: Tone }> = {
  verified: { label: "Verified", tone: "success" },
  pending: { label: "Waiting for DNS", tone: "warning" },
  failed: { label: "Check failed", tone: "danger" },
};

// "Up to 10" / "Unlimited".
export function formatLimit(value: number | null, noun: string) {
  return value === null ? `Unlimited ${noun}` : `Up to ${value} ${value === 1 ? noun.replace(/ies$/, "y").replace(/s$/, "") : noun}`;
}
