import { adminNavItem } from "../nav";
import type { AnalyticsFilters, AnalyticsMetric, AnalyticsPeriod, CompanyPlan } from "../types";

// Period, plan and chart metric live in the URL so a view can be shared.

export type SearchParams = Record<string, string | string[] | undefined>;

const PERIODS: readonly AnalyticsPeriod[] = ["30d", "90d", "12m"];
const PLANS: readonly CompanyPlan[] = ["Starter", "Standard", "Pro"];
const METRICS: readonly AnalyticsMetric[] = ["companies", "mrr"];

export const DEFAULT_FILTERS: AnalyticsFilters = { period: "90d", plan: "", metric: "companies" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function parseFilters(params: SearchParams): AnalyticsFilters {
  return {
    period: oneOf(first(params.period), PERIODS, DEFAULT_FILTERS.period),
    plan: oneOf(first(params.plan), ["", ...PLANS] as const, ""),
    metric: oneOf(first(params.metric), METRICS, DEFAULT_FILTERS.metric),
  };
}

// Only non-default values are written, so the canonical URL stays short.
export function filtersToQuery(filters: AnalyticsFilters) {
  const query = new URLSearchParams();
  if (filters.period !== DEFAULT_FILTERS.period) query.set("period", filters.period);
  if (filters.plan) query.set("plan", filters.plan);
  if (filters.metric !== DEFAULT_FILTERS.metric) query.set("metric", filters.metric);
  const text = query.toString();
  return text ? `?${text}` : "";
}

export function analyticsHref(filters: AnalyticsFilters) {
  return `${adminNavItem("analytics").href}${filtersToQuery(filters)}`;
}

export const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "12m": "Last 12 months",
};

// "vs the previous 90 days"
export const PERIOD_COMPARE: Record<AnalyticsPeriod, string> = {
  "30d": "vs previous 30 days",
  "90d": "vs previous 90 days",
  "12m": "vs previous 12 months",
};

export const METRIC_LABELS: Record<AnalyticsMetric, string> = {
  companies: "Companies",
  mrr: "MRR",
};
