import { adminNavItem } from "../nav";
import type { JoinedPeriod, CompanyFilters, CompanyPlan, CompanyStatusFilter, WebsiteRequestFilters, WebsiteRequestStatus } from "../types";

// The Accounts list state lives in the URL so filters survive reloads, back
// navigation and opening a company in the side panel.

export type SearchParams = Record<string, string | string[] | undefined>;

export type AccountsTab = "companies" | "enforcement" | "websites";

export const STATUS_FILTERS: readonly CompanyStatusFilter[] = ["all", "active", "pending", "suspended", "suspended-admin", "suspended-nonpayment", "closed"];
const PLANS: readonly CompanyPlan[] = ["Starter", "Standard", "Pro"];
const PERIODS: readonly JoinedPeriod[] = ["all", "7d", "30d", "month"];
const SORTS: readonly CompanyFilters["sort"][] = ["newest", "oldest", "name"];

export const DEFAULT_FILTERS: CompanyFilters = { q: "", status: "all", plan: "", region: "", period: "all", sort: "newest", page: 1 };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function parseTab(params: SearchParams): AccountsTab {
  const tab = first(params.tab);
  return tab === "enforcement" || tab === "websites" ? tab : "companies";
}

export function parsePage(params: SearchParams) {
  const page = Number.parseInt(first(params.page) ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function parseFilters(params: SearchParams): CompanyFilters {
  return {
    q: (first(params.q) ?? "").slice(0, 80),
    status: oneOf(first(params.status), STATUS_FILTERS, "all"),
    plan: oneOf(first(params.plan), ["", ...PLANS] as const, ""),
    region: first(params.region) ?? "",
    period: oneOf(first(params.period), PERIODS, "all"),
    sort: oneOf(first(params.sort), SORTS, "newest"),
    page: parsePage(params),
  };
}

// Only non-default values are written, so the canonical URL stays short.
export function filtersToQuery(filters: Partial<CompanyFilters>, tab: AccountsTab = "companies") {
  const query = new URLSearchParams();
  if (tab !== "companies") query.set("tab", tab);
  if (filters.q) query.set("q", filters.q);
  if (filters.status && filters.status !== "all") query.set("status", filters.status);
  if (filters.plan) query.set("plan", filters.plan);
  if (filters.region) query.set("region", filters.region);
  if (filters.period && filters.period !== "all") query.set("period", filters.period);
  if (filters.sort && filters.sort !== "newest") query.set("sort", filters.sort);
  if (filters.page && filters.page > 1) query.set("page", String(filters.page));
  const text = query.toString();
  return text ? `?${text}` : "";
}

export function companiesHref(filters: Partial<CompanyFilters> = {}) {
  return `${adminNavItem("accounts").href}${filtersToQuery(filters)}`;
}

export function enforcementHref(page = 1) {
  return `${adminNavItem("accounts").href}${filtersToQuery({ page }, "enforcement")}`;
}

export function companyHref(id: string, filters: Partial<CompanyFilters> = {}) {
  return `${adminNavItem("accounts").href}/${encodeURIComponent(id)}${filtersToQuery(filters)}`;
}

// --- Website requests ---------------------------------------------------------

export const WEBSITE_REQUEST_STATUS_FILTERS: readonly (WebsiteRequestStatus | "all")[] = ["all", "requested", "in-progress", "review"];
export const DEFAULT_WEBSITE_REQUEST_FILTERS: WebsiteRequestFilters = { q: "", status: "all", assignee: "" };

export function parseWebsiteRequestFilters(params: SearchParams): WebsiteRequestFilters {
  return {
    q: (first(params.q) ?? "").slice(0, 80),
    status: oneOf(first(params.status), WEBSITE_REQUEST_STATUS_FILTERS, "all"),
    assignee: (first(params.assignee) ?? "").slice(0, 40),
  };
}

export function websiteRequestsQuery(filters: Partial<WebsiteRequestFilters> = {}) {
  const query = new URLSearchParams({ tab: "websites" });
  if (filters.q) query.set("q", filters.q);
  if (filters.status && filters.status !== "all") query.set("status", filters.status);
  if (filters.assignee) query.set("assignee", filters.assignee);
  return `?${query.toString()}`;
}

export function websiteRequestsHref(filters: Partial<WebsiteRequestFilters> = {}) {
  return `${adminNavItem("accounts").href}${websiteRequestsQuery(filters)}`;
}

export function websiteRequestHref(id: string) {
  return `${adminNavItem("accounts").href}/website-requests/${encodeURIComponent(id)}`;
}

export function hasActiveFilters(filters: CompanyFilters) {
  return Boolean(filters.q || filters.status !== "all" || filters.plan || filters.region || filters.period !== "all");
}

export const STATUS_FILTER_LABELS: Record<CompanyStatusFilter, string> = {
  all: "All",
  active: "Active",
  pending: "Pending setup",
  suspended: "Suspended (any)",
  "suspended-admin": "Suspended by admin",
  "suspended-nonpayment": "Suspended · non-payment",
  closed: "Closed",
};

export const PERIOD_LABELS: Record<JoinedPeriod, string> = {
  all: "All time",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  month: "This month",
};

export const SORT_LABELS: Record<CompanyFilters["sort"], string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  name: "Name A–Z",
};
