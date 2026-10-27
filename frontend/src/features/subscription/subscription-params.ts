import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { single, type SearchParams } from "@/lib/routes/search-params";

// Subscription page state in the URL: the open panel (?panel=change-plan|cancel|reactivate)
// and ?error after a refused change.

export type SubscriptionPanel = "change-plan" | "cancel" | "reactivate";

export const SUBSCRIPTION_ERROR_MESSAGES = {
  OVER_LIMIT: "That plan can't hold what you use today. Remove some before you change to it.",
  CANCELLED: "This subscription is cancelled, so the plan can't be changed. Reactivate it first.",
  NOT_CANCELLED: "This subscription is already active.",
  NOT_FOUND: "That plan isn't available.",
  FORBIDDEN: "Only the Owner can change the subscription.",
  FAILED: "That change couldn't be saved. Try again.",
} as const;

export type SubscriptionErrorCode = keyof typeof SUBSCRIPTION_ERROR_MESSAGES;

const PANELS: SubscriptionPanel[] = ["change-plan", "cancel", "reactivate"];

export function parseSubscriptionParams(query: SearchParams) {
  const error = single(query.error);
  return {
    panel: PANELS.find((panel) => panel === single(query.panel)) ?? null,
    error: error && Object.hasOwn(SUBSCRIPTION_ERROR_MESSAGES, error) ? (error as SubscriptionErrorCode) : null,
  };
}

export function subscriptionHref(open: { panel?: SubscriptionPanel; error?: SubscriptionErrorCode } = {}) {
  const params = new URLSearchParams();
  if (open.panel) params.set("panel", open.panel);
  if (open.error) params.set("error", open.error);
  const query = params.toString();
  return query ? `${COMPANY_PATHS.subscription}?${query}` : COMPANY_PATHS.subscription;
}

export function invoiceHref(invoiceId: string) {
  return `${COMPANY_PATHS.subscription}/invoices/${encodeURIComponent(invoiceId)}`;
}
