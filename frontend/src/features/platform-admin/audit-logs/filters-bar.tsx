"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { AdminField, AdminInput, AdminSelect } from "../components/form";
import { useQueryNavigation } from "../components/use-query-navigation";
import type { AuditCategory, AuditDateRange, AuditFilters } from "../types";
import { CATEGORIES, DEFAULT_FILTERS, filtersToQuery, hasActiveFilters, RANGE_LABELS } from "./search-params";
import { CATEGORY_META } from "./status";

const RANGES = Object.keys(RANGE_LABELS) as AuditDateRange[];
const SEARCH_DEBOUNCE_MS = 300;
const RESET_PAGE = { page: 1 };

// Search · Actor · Category · Date range · Critical only, with Reset. Every
// change is written to the URL and restarts at page 1.
export function FiltersBar({ filters, actors }: { filters: AuditFilters; actors: { id: string; name: string }[] }) {
  const { update, isPending } = useQueryNavigation(filters, filtersToQuery, RESET_PAGE);
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
    update({ ...DEFAULT_FILTERS });
  };

  return (
    <form
      role="search"
      aria-label="Filter audit events"
      aria-busy={isPending || undefined}
      onSubmit={(event) => {
        event.preventDefault();
        clearTimeout(timer.current ?? undefined);
        update({ q: query.trim() });
      }}
      className="flex flex-wrap items-end gap-3 rounded-[14px] border border-admin-border bg-admin-card p-4"
    >
      <AdminField label="Search" htmlFor="audit-search" className="min-w-50 flex-[2_1_220px]">
        <AdminInput id="audit-search" type="search" icon={Search} placeholder="Action, company, admin, IP or event ID…" value={query} onChange={(event) => onQueryChange(event.target.value)} />
      </AdminField>
      <AdminField label="Actor" htmlFor="audit-actor" className="flex-[1_1_150px]">
        <AdminSelect id="audit-actor" value={filters.actor} onChange={(event) => update({ actor: event.target.value })}>
          <option value="">Everyone</option>
          {actors.map((actor) => (
            <option key={actor.id} value={actor.id}>
              {actor.name}
            </option>
          ))}
        </AdminSelect>
      </AdminField>
      <AdminField label="Category" htmlFor="audit-category" className="flex-[1_1_140px]">
        <AdminSelect id="audit-category" value={filters.category} onChange={(event) => update({ category: event.target.value as "" | AuditCategory })}>
          <option value="">All</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_META[category].label}
            </option>
          ))}
        </AdminSelect>
      </AdminField>
      <AdminField label="Date" htmlFor="audit-range" className="flex-[1_1_130px]">
        <AdminSelect id="audit-range" value={filters.range} onChange={(event) => update({ range: event.target.value as AuditDateRange })}>
          {RANGES.map((range) => (
            <option key={range} value={range}>
              {RANGE_LABELS[range]}
            </option>
          ))}
        </AdminSelect>
      </AdminField>
      <label className="flex h-9.5 items-center gap-2 text-[12.5px] font-medium whitespace-nowrap text-admin-heading">
        {/* Uncontrolled (re-keyed on the URL value) so the tick shows at once, before the list reloads. */}
        <input key={String(filters.critical)} type="checkbox" defaultChecked={filters.critical} onChange={(event) => update({ critical: event.target.checked })} className="focus-ring size-4 rounded border-admin-border accent-admin-primary" />
        Critical only
      </label>
      <button
        type="button"
        onClick={reset}
        disabled={!hasActiveFilters(filters) && query === ""}
        className="focus-ring h-9.5 rounded-md px-2 text-[12.5px] font-medium text-admin-primary hover:underline disabled:text-admin-muted-text disabled:no-underline"
      >
        Reset
      </button>
    </form>
  );
}
