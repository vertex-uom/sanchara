"use client";

import { useQueryNavigation } from "../components/use-query-navigation";
import { AdminField, AdminSelect } from "../components/form";
import type { AnalyticsFilters, AnalyticsPeriod, CompanyPlan } from "../types";
import { DEFAULT_FILTERS, filtersToQuery, PERIOD_LABELS } from "./search-params";

const PERIODS = Object.keys(PERIOD_LABELS) as AnalyticsPeriod[];

// Period and Plan; every change is written to the URL.
export function FiltersBar({ filters, plans }: { filters: AnalyticsFilters; plans: readonly CompanyPlan[] }) {
  const { update, isPending } = useQueryNavigation(filters, filtersToQuery);
  const dirty = filters.period !== DEFAULT_FILTERS.period || filters.plan !== "";

  return (
    <form role="search" aria-label="Filter analytics" aria-busy={isPending || undefined} onSubmit={(event) => event.preventDefault()} className="flex flex-wrap items-end gap-3 rounded-[14px] border border-admin-border bg-admin-card p-4">
      <AdminField label="Period" htmlFor="analytics-period" className="flex-[1_1_170px] sm:max-w-[220px]">
        <AdminSelect id="analytics-period" value={filters.period} onChange={(event) => update({ period: event.target.value as AnalyticsPeriod })}>
          {PERIODS.map((period) => (
            <option key={period} value={period}>
              {PERIOD_LABELS[period]}
            </option>
          ))}
        </AdminSelect>
      </AdminField>
      <AdminField label="Plan" htmlFor="analytics-plan" className="flex-[1_1_140px] sm:max-w-[180px]">
        <AdminSelect id="analytics-plan" value={filters.plan} onChange={(event) => update({ plan: event.target.value as AnalyticsFilters["plan"] })}>
          <option value="">All plans</option>
          {plans.map((plan) => (
            <option key={plan} value={plan}>
              {plan}
            </option>
          ))}
        </AdminSelect>
      </AdminField>
      <button
        type="button"
        onClick={() => update({ period: DEFAULT_FILTERS.period, plan: "" })}
        disabled={!dirty}
        className="focus-ring h-[38px] rounded-md px-2 text-[12.5px] font-medium text-admin-primary hover:underline disabled:text-admin-muted-text disabled:no-underline"
      >
        Reset
      </button>
      <p className="ml-auto self-center text-[11px] text-admin-muted-text">Platform growth only: nothing here reads bookings, guests or payments.</p>
    </form>
  );
}
