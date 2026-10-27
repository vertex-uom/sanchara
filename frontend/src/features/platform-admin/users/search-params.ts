import { oneOf, type SearchParams, single } from "@/lib/routes/search-params";
import { adminNavItem } from "../nav";
import type { StaffActivityPeriod, StaffFilters, StaffRole } from "../types";

// The Users list state lives in the URL so filters survive reloads, back
// navigation and opening a user in the side panel. The role sub-tabs are the
// Role filter (`role=`).

export const ROLE_TABS: readonly StaffFilters["role"][] = ["all", "owner", "manager", "front-desk"];
const STATUSES: readonly StaffFilters["status"][] = ["all", "active", "invited", "locked"];
const ACTIVITIES: readonly StaffActivityPeriod[] = ["any", "24h", "7d", "30d", "inactive"];
const SORTS: readonly StaffFilters["sort"][] = ["recent", "name", "newest"];

export const DEFAULT_FILTERS: StaffFilters = { q: "", role: "all", status: "all", company: "", activity: "any", sort: "recent", page: 1 };

export function parseFilters(params: SearchParams): StaffFilters {
  const page = Number.parseInt(single(params.page) ?? "1", 10);
  return {
    q: (single(params.q) ?? "").slice(0, 80),
    role: oneOf(single(params.role), ROLE_TABS, "all"),
    status: oneOf(single(params.status), STATUSES, "all"),
    company: (single(params.company) ?? "").slice(0, 40),
    activity: oneOf(single(params.activity), ACTIVITIES, "any"),
    sort: oneOf(single(params.sort), SORTS, "recent"),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

// Only non-default values are written, so the canonical URL stays short.
export function filtersToQuery(filters: Partial<StaffFilters>) {
  const query = new URLSearchParams();
  if (filters.role && filters.role !== "all") query.set("role", filters.role);
  if (filters.q) query.set("q", filters.q);
  if (filters.status && filters.status !== "all") query.set("status", filters.status);
  if (filters.company) query.set("company", filters.company);
  if (filters.activity && filters.activity !== "any") query.set("activity", filters.activity);
  if (filters.sort && filters.sort !== "recent") query.set("sort", filters.sort);
  if (filters.page && filters.page > 1) query.set("page", String(filters.page));
  const text = query.toString();
  return text ? `?${text}` : "";
}

export function usersHref(filters: Partial<StaffFilters> = {}) {
  return `${adminNavItem("users").href}${filtersToQuery(filters)}`;
}

export function userHref(id: string, filters: Partial<StaffFilters> = {}) {
  return `${adminNavItem("users").href}/${encodeURIComponent(id)}${filtersToQuery(filters)}`;
}

export function hasActiveFilters(filters: StaffFilters) {
  return Boolean(filters.q || filters.status !== "all" || filters.company || filters.activity !== "any");
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  owner: "Owner",
  manager: "Manager",
  "front-desk": "Front Desk",
};

export const ROLE_TAB_LABELS: Record<StaffFilters["role"], string> = { all: "All", owner: "Owners", manager: "Managers", "front-desk": "Front Desk" };

export const STATUS_FILTER_LABELS: Record<StaffFilters["status"], string> = { all: "All", active: "Active", invited: "Invited", locked: "Locked" };

export const ACTIVITY_LABELS: Record<StaffActivityPeriod, string> = {
  any: "Any time",
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  inactive: "Not in 30 days",
};

export const SORT_LABELS: Record<StaffFilters["sort"], string> = {
  recent: "Recently active",
  name: "Name A–Z",
  newest: "Newest accounts",
};

