import { formatRelativeDateTime } from "@/lib/format/dates";
import type { CompanyAccountStatus, EnforcementKind, SubscriptionState, Tone, WebsiteRequestStatus } from "../types";

// Chip labels and tones for company, subscription and enforcement states
// (Figma Status Chip: success for live, info for not-yet, danger for
// suspensions, warning for money trouble).
export const COMPANY_STATUS_META: Record<CompanyAccountStatus, { label: string; short: string; tone: Tone }> = {
  active: { label: "Active", short: "Active", tone: "success" },
  pending: { label: "Pending setup", short: "Pending", tone: "info" },
  "suspended-admin": { label: "Suspended by admin", short: "Suspended", tone: "danger" },
  "suspended-nonpayment": { label: "Suspended · non-payment", short: "Suspended", tone: "warning" },
  closed: { label: "Closed", short: "Closed", tone: "neutral" },
};

export const SUBSCRIPTION_STATE_META: Record<SubscriptionState, { label: string; tone: Tone }> = {
  paid: { label: "Paid", tone: "success" },
  suspended: { label: "Unpaid", tone: "danger" },
  closed: { label: "Closed", tone: "neutral" },
  none: { label: "Not started", tone: "neutral" },
};

export const ENFORCEMENT_KIND_META: Record<EnforcementKind, { label: string; tone: Tone }> = {
  suspended: { label: "Suspended", tone: "danger" },
  reactivated: { label: "Reactivated", tone: "success" },
  "suspended-nonpayment": { label: "Suspended · non-payment", tone: "warning" },
  "reactivated-payment": { label: "Reactivated · paid", tone: "success" },
  closed: { label: "Closed · data deleted", tone: "neutral" },
  warning: { label: "Warning", tone: "info" },
};

export const WEBSITE_REQUEST_STATUS_META: Record<WebsiteRequestStatus, { label: string; tone: Tone }> = {
  requested: { label: "Requested", tone: "info" },
  "in-progress": { label: "In progress", tone: "warning" },
  review: { label: "Owner review", tone: "neutral" },
};

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

// History entries can be a year old (non-payment → closed). Recent entries read
// relatively ("Today, 09:00 AM"); anything from another year keeps its year.
export function formatHistoryDateTime(iso: string, now: Date) {
  const year = (d: Date) => new Intl.DateTimeFormat("en-GB", { year: "numeric", timeZone: "Asia/Colombo" }).format(d);
  return year(new Date(iso)) === year(now) ? formatRelativeDateTime(iso, now) : formatDateTime(iso);
}
