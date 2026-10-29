"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminField, AdminInput, AdminSelect } from "../components/form";
import type { StaffActivityPeriod, StaffFilters } from "../types";
import { ACTIVITY_LABELS, hasActiveFilters, STATUS_FILTER_LABELS } from "./search-params";
import { useListNavigation } from "./use-list-navigation";

const STATUSES = Object.keys(STATUS_FILTER_LABELS) as StaffFilters["status"][];
const ACTIVITIES = Object.keys(ACTIVITY_LABELS) as StaffActivityPeriod[];
const SEARCH_DEBOUNCE_MS = 300;

// Filter card: search plus Status, Company and Last active selects, with a
// Reset link. Role is chosen with the sub-tabs above. Every change is
// written to the URL.
export function FiltersBar({ filters, options, className }: { filters: StaffFilters; options: { companies: { id: string; name: string }[] }; className?: string }) {
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
    update({ q: "", status: "all", company: "", activity: "any" });
  };

  return (
    <form
      role="search"
      aria-label="Filter users"
      aria-busy={isPending || undefined}
      onSubmit={(event) => {
        event.preventDefault();
        clearTimeout(timer.current ?? undefined);
        update({ q: query.trim() });
      }}
      className={cn("flex flex-wrap items-end gap-3 rounded-[14px] border border-admin-border bg-admin-card p-4", className)}
    >
      <AdminField label="Search" htmlFor="users-search" className="min-w-50 flex-[2_1_240px]">
        <AdminInput id="users-search" type="search" icon={Search} placeholder="Search name, email, company or ID…" value={query} onChange={(event) => onQueryChange(event.target.value)} />
      </AdminField>
      <AdminField label="Status" htmlFor="users-status" className="flex-[1_1_120px]">
        <AdminSelect id="users-status" value={filters.status} onChange={(event) => update({ status: event.target.value as StaffFilters["status"] })}>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_FILTER_LABELS[status]}
            </option>
          ))}
        </AdminSelect>
      </AdminField>
      <AdminField label="Company" htmlFor="users-company" className="flex-[1_1_180px]">
        <AdminSelect id="users-company" value={filters.company} onChange={(event) => update({ company: event.target.value })}>
          <option value="">All</option>
          {options.companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </AdminSelect>
      </AdminField>
      <AdminField label="Last active" htmlFor="users-activity" className="flex-[1_1_140px]">
        <AdminSelect id="users-activity" value={filters.activity} onChange={(event) => update({ activity: event.target.value as StaffActivityPeriod })}>
          {ACTIVITIES.map((activity) => (
            <option key={activity} value={activity}>
              {ACTIVITY_LABELS[activity]}
            </option>
          ))}
        </AdminSelect>
      </AdminField>
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
