import { oneOf, type SearchParams, single } from "@/lib/routes/search-params";
import { adminNavItem } from "../nav";
import type { CompanyPlan, SubscriptionDue, SubscriptionFilters } from "../types";

// The Financial Operations list state lives in the URL so filters survive
// reloads, back navigation and opening a subscription in the side panel.

export type FinanceTab = "subscriptions" | "exchange-rate";

const PLANS: readonly CompanyPlan[] = ["Starter", "Standard", "Pro"];
const STATUSES: readonly SubscriptionFilters["status"][] = ["all", "paid", "suspended", "not-started", "closed"];
const DUES: readonly SubscriptionDue[] = ["any", "7d", "30d"];
const SORTS: readonly SubscriptionFilters["sort"][] = ["due", "name", "amount"];

export const DEFAULT_FILTERS: SubscriptionFilters = { q: "", plan: "", status: "all", due: "any", sort: "due", page: 1 };

export function parseTab(params: SearchParams): FinanceTab {
  return single(params.tab) === "exchange-rate" ? "exchange-rate" : "subscriptions";
}

export function parseFilters(params: SearchParams): SubscriptionFilters {
  const page = Number.parseInt(single(params.page) ?? "1", 10);
  return {
    q: (single(params.q) ?? "").slice(0, 80),
    plan: oneOf(single(params.plan), ["", ...PLANS] as const, ""),
    status: oneOf(single(params.status), STATUSES, "all"),
    due: oneOf(single(params.due), DUES, "any"),
    sort: oneOf(single(params.sort), SORTS, "due"),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

// Only non-default values are written, so the canonical URL stays short.
export function filtersToQuery(filters: Partial<SubscriptionFilters>) {
  const query = new URLSearchParams();
  if (filters.q) query.set("q", filters.q);
  if (filters.plan) query.set("plan", filters.plan);
  if (filters.status && filters.status !== "all") query.set("status", filters.status);
  if (filters.due && filters.due !== "any") query.set("due", filters.due);
  if (filters.sort && filters.sort !== "due") query.set("sort", filters.sort);
  if (filters.page && filters.page > 1) query.set("page", String(filters.page));
  const text = query.toString();
  return text ? `?${text}` : "";
}

export function subscriptionsHref(filters: Partial<SubscriptionFilters> = {}) {
  return `${adminNavItem("finance").href}${filtersToQuery(filters)}`;
}

export function exchangeRateHref() {
  return `${adminNavItem("finance").href}?tab=exchange-rate`;
}

export function subscriptionHref(id: string, filters: Partial<SubscriptionFilters> = {}) {
  return `${adminNavItem("finance").href}/${encodeURIComponent(id)}${filtersToQuery(filters)}`;
}

export function hasActiveFilters(filters: SubscriptionFilters) {
  return Boolean(filters.q || filters.plan || filters.status !== "all" || filters.due !== "any");
}

export const STATUS_FILTER_LABELS: Record<SubscriptionFilters["status"], string> = {
  all: "All",
  paid: "Paid",
  suspended: "Suspended · unpaid",
  "not-started": "Not started",
  closed: "Closed",
};

export const DUE_LABELS: Record<SubscriptionDue, string> = {
  any: "Any time",
  "7d": "Next 7 days",
  "30d": "Next 30 days",
};

export const SORT_LABELS: Record<SubscriptionFilters["sort"], string> = {
  due: "Most urgent",
  name: "Company A–Z",
  amount: "Amount high–low",
};
