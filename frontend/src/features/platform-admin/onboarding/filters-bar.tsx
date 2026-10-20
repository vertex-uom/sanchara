"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { AdminField, AdminInput, AdminSelect } from "../components/form";
import type { ApplicationFilters, ApplicationPeriod, ApplicationStatusFilter } from "../types";
import { hasActiveFilters, PERIOD_LABELS, STATUS_FILTER_LABELS, STATUS_FILTERS } from "./search-params";
import { useListNavigation } from "./use-list-navigation";

const PERIODS = Object.keys(PERIOD_LABELS) as ApplicationPeriod[];
const SEARCH_DEBOUNCE_MS = 300;

// Filter card from the design: search plus Status, Region, Business type and
// Date range selects, with a Reset link. Every change is written to the URL.
export function FiltersBar({ filters, options }: { filters: ApplicationFilters; options: { regions: string[]; types: string[] } }) {
  const { update, isPending } = useListNavigation(filters);
  const [query, setQuery] = useState(filters.q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

  const onQueryChange = (value: string) => {
    setQuery(value);
    clearTimeout(timer.current ?? undefined);
    timer.current = setTimeout(() => update({ q: value.trim() }), SEARCH_DEBOUNCE_MS);
  };

  const reset = () => {
    clearTimeout(timer.current ?? undefined);
    setQuery("");
    update({ q: "", status: "all", region: "", type: "", period: "all" });
  };

  return (
    <form
      role="search"
      aria-label="Filter applications"
      aria-busy={isPending || undefined}
      onSubmit={(event) => {
        event.preventDefault();
        clearTimeout(timer.current ?? undefined);
        update({ q: query.trim() });
      }}
      className="flex flex-wrap items-end gap-3 rounded-[14px] border border-admin-border bg-admin-card p-4"
    >
      <AdminField label="Search" htmlFor="applications-search" className="min-w-[200px] flex-[2_1_220px]">
        <AdminInput
          id="applications-search"
          type="search"
          icon={Search}
          placeholder="Search business name, applicant or APP ID…"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </AdminField>
      <AdminField label="Status" htmlFor="applications-status" className="flex-[1_1_130px]">
        <AdminSelect id="applications-status" value={filters.status} onChange={(event) => update({ status: event.target.value as ApplicationStatusFilter })}>
          {STATUS_FILTERS.map((status) => (
            <option key={status} value={status}>
              {STATUS_FILTER_LABELS[status]}
            </option>
          ))}
        </AdminSelect>
      </AdminField>
      <AdminField label="Region" htmlFor="applications-region" className="flex-[1_1_130px]">
        <AdminSelect id="applications-region" value={filters.region} onChange={(event) => update({ region: event.target.value })}>
          <option value="">All</option>
          {options.regions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </AdminSelect>
      </AdminField>
      <AdminField label="Business type" htmlFor="applications-type" className="flex-[1_1_130px]">
        <AdminSelect id="applications-type" value={filters.type} onChange={(event) => update({ type: event.target.value })}>
          <option value="">All</option>
          {options.types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </AdminSelect>
      </AdminField>
      <AdminField label="Date range" htmlFor="applications-period" className="flex-[1_1_140px]">
        <AdminSelect id="applications-period" value={filters.period} onChange={(event) => update({ period: event.target.value as ApplicationPeriod })}>
          {PERIODS.map((period) => (
            <option key={period} value={period}>
              {PERIOD_LABELS[period]}
            </option>
          ))}
        </AdminSelect>
      </AdminField>
      <button
        type="button"
        onClick={reset}
        disabled={!hasActiveFilters(filters) && query === ""}
        className="focus-ring h-[38px] rounded-md px-2 text-[12.5px] font-medium text-admin-primary hover:underline disabled:text-admin-muted-text disabled:no-underline"
      >
        Reset
      </button>
    </form>
  );
}
