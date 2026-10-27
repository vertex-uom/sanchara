import { adminNavItem } from "../nav";
import type { AuditCategory, AuditDateRange, AuditFilters } from "../types";

// Filters and page live in the URL so a view can be shared and an event can
// stay open in the side panel while filtering.

export type SearchParams = Record<string, string | string[] | undefined>;

export const CATEGORIES: readonly AuditCategory[] = ["companies", "admin-users", "finance", "configuration", "announcements", "websites", "sign-ins"];
const RANGES: readonly AuditDateRange[] = ["today", "7d", "30d", "all"];

export const DEFAULT_FILTERS: AuditFilters = { q: "", actor: "", category: "", range: "30d", critical: false, page: 1 };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function parseFilters(params: SearchParams): AuditFilters {
  const page = Number.parseInt(first(params.page) ?? "1", 10);
  return {
    q: (first(params.q) ?? "").trim().slice(0, 80),
    actor: (first(params.actor) ?? "").slice(0, 40),
    category: oneOf(first(params.category), ["", ...CATEGORIES] as const, ""),
    range: oneOf(first(params.range), RANGES, DEFAULT_FILTERS.range),
    critical: first(params.critical) === "1",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

// Only non-default values are written, so the canonical URL stays short.
export function filtersToQuery(filters: Partial<AuditFilters>) {
  const query = new URLSearchParams();
  if (filters.q) query.set("q", filters.q);
  if (filters.actor) query.set("actor", filters.actor);
  if (filters.category) query.set("category", filters.category);
  if (filters.range && filters.range !== DEFAULT_FILTERS.range) query.set("range", filters.range);
  if (filters.critical) query.set("critical", "1");
  if (filters.page && filters.page > 1) query.set("page", String(filters.page));
  const text = query.toString();
  return text ? `?${text}` : "";
}

export function auditLogsHref(filters: Partial<AuditFilters> = {}) {
  return `${adminNavItem("audit-logs").href}${filtersToQuery(filters)}`;
}

export function auditEventHref(id: string, filters: Partial<AuditFilters> = {}) {
  return `${adminNavItem("audit-logs").href}/${encodeURIComponent(id)}${filtersToQuery(filters)}`;
}

export function hasActiveFilters(filters: AuditFilters) {
  return Boolean(filters.q || filters.actor || filters.category || filters.range !== DEFAULT_FILTERS.range || filters.critical);
}

export const RANGE_LABELS: Record<AuditDateRange, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All (1 year)",
};
