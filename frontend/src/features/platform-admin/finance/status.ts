import type { SubscriptionInvoiceStatus, SubscriptionStatus, Tone } from "../types";

export { formatDateTime } from "../accounts/status";

// Chip tones for subscription states (Figma Status Chip): paid is fine,
// suspended is a problem, not started and closed are neutral.
export const SUBSCRIPTION_STATUS_META: Record<SubscriptionStatus, { label: string; tone: Tone }> = {
  paid: { label: "Paid", tone: "success" },
  suspended: { label: "Suspended", tone: "danger" },
  "not-started": { label: "Not started", tone: "neutral" },
  closed: { label: "Closed", tone: "neutral" },
};

export const INVOICE_STATUS_META: Record<SubscriptionInvoiceStatus, { label: string; tone: Tone }> = {
  paid: { label: "Paid", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
};

// "2026-10-20": today's date in Sri Lanka time, to compare with date-only values.
export function todayKey(now: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo" }).format(now);
}

// Whole days from today (Colombo) to a date-only value; negative when past.
export function daysFromToday(isoDate: string, today: string) {
  return Math.round((Date.parse(`${isoDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

// "today", "tomorrow", "in 12 days", "yesterday", "6 days ago".
export function describeDays(days: number) {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

// "1st", "2nd", "3rd", "14th", "21st".
export function ordinal(day: number) {
  const rem10 = day % 10;
  const rem100 = day % 100;
  const suffix = rem10 === 1 && rem100 !== 11 ? "st" : rem10 === 2 && rem100 !== 12 ? "nd" : rem10 === 3 && rem100 !== 13 ? "rd" : "th";
  return `${day}${suffix}`;
}

// LKR per USD, always two decimals: "298.40".
export function formatRate(rate: number) {
  return rate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
