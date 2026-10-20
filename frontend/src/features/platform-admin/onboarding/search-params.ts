import { adminNavItem } from "../nav";
import type { ApplicationFilters, ApplicationPeriod, ApplicationSort, ApplicationStatusFilter } from "../types";

// The Onboarding list state lives in the URL so filters survive reloads,
// back navigation and opening an application in the side panel.

export type SearchParams = Record<string, string | string[] | undefined>;

export type OnboardingTab = "applications" | "re-verification";

export const STATUS_FILTERS: readonly ApplicationStatusFilter[] = ["all", "open", "submitted", "resubmitted", "in-review", "more-info", "on-hold", "approved", "rejected"];
const PERIODS: readonly ApplicationPeriod[] = ["all", "7d", "30d", "month"];
const SORTS: readonly ApplicationSort[] = ["newest", "oldest"];

export const DEFAULT_FILTERS: ApplicationFilters = { q: "", status: "all", region: "", type: "", period: "all", sort: "newest", page: 1 };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function parseTab(params: SearchParams): OnboardingTab {
  return first(params.tab) === "re-verification" ? "re-verification" : "applications";
}

export function parseFilters(params: SearchParams): ApplicationFilters {
  const page = Number.parseInt(first(params.page) ?? "1", 10);
  return {
    q: (first(params.q) ?? "").slice(0, 80),
    status: oneOf(first(params.status), STATUS_FILTERS, "all"),
    region: first(params.region) ?? "",
    type: first(params.type) ?? "",
    period: oneOf(first(params.period), PERIODS, "all"),
    sort: oneOf(first(params.sort), SORTS, "newest"),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

// Only non-default values are written, so the canonical URL stays short.
export function filtersToQuery(filters: Partial<ApplicationFilters>, tab: OnboardingTab = "applications") {
  const query = new URLSearchParams();
  if (tab !== "applications") query.set("tab", tab);
  if (filters.q) query.set("q", filters.q);
  if (filters.status && filters.status !== "all") query.set("status", filters.status);
  if (filters.region) query.set("region", filters.region);
  if (filters.type) query.set("type", filters.type);
  if (filters.period && filters.period !== "all") query.set("period", filters.period);
  if (filters.sort && filters.sort !== "newest") query.set("sort", filters.sort);
  if (filters.page && filters.page > 1) query.set("page", String(filters.page));
  const text = query.toString();
  return text ? `?${text}` : "";
}

export function applicationsHref(filters: Partial<ApplicationFilters> = {}, tab: OnboardingTab = "applications") {
  return `${adminNavItem("onboarding").href}${filtersToQuery(filters, tab)}`;
}

export function applicationHref(id: string, filters: Partial<ApplicationFilters> = {}) {
  return `${adminNavItem("onboarding").href}/${encodeURIComponent(id)}${filtersToQuery(filters)}`;
}

export function hasActiveFilters(filters: ApplicationFilters) {
  return Boolean(filters.q || filters.status !== "all" || filters.region || filters.type || filters.period !== "all");
}

export const STATUS_FILTER_LABELS: Record<ApplicationStatusFilter, string> = {
  all: "All",
  open: "Open",
  submitted: "Submitted",
  resubmitted: "Resubmitted",
  "in-review": "In review",
  "more-info": "Awaiting applicant",
  "on-hold": "On hold",
  approved: "Approved",
  rejected: "Rejected",
};

export const PERIOD_LABELS: Record<ApplicationPeriod, string> = {
  all: "All time",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  month: "This month",
};

export const SORT_LABELS: Record<ApplicationSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
};
