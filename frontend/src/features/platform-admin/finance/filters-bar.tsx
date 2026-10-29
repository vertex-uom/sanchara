"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminField, AdminInput, AdminSelect } from "../components/form";
import type { CompanyPlan, SubscriptionDue, SubscriptionFilters } from "../types";
import { DUE_LABELS, hasActiveFilters, STATUS_FILTER_LABELS } from "./search-params";
import { useListNavigation } from "./use-list-navigation";

const STATUSES = Object.keys(STATUS_FILTER_LABELS) as SubscriptionFilters["status"][];
const DUES = Object.keys(DUE_LABELS) as SubscriptionDue[];
const SEARCH_DEBOUNCE_MS = 300;

// Filter card: search plus Plan, Status and Renews selects, with a Reset link.
// Every change is written to the URL.
export function FiltersBar({ filters, plans, className }: { filters: SubscriptionFilters; plans: readonly CompanyPlan[]; className?: string }) {
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
    update({ q: "", plan: "", status: "all", due: "any" });
  };

  return (
    <form
      role="search"
      aria-label="Filter subscriptions"
      aria-busy={isPending || undefined}
      onSubmit={(event) => {
        event.preventDefault();
        clearTimeout(timer.current ?? undefined);
        update({ q: query.trim() });
      }}
      className={cn("flex flex-wrap items-end gap-3 rounded-[14px] border border-admin-border bg-admin-card p-4", className)}
    >
      <AdminField label="Search" htmlFor="subscriptions-search" className="min-w-50 flex-[2_1_240px]">
        <AdminInput id="subscriptions-search" type="search" icon={Search} placeholder="Search company, location or ID…" value={query} onChange={(event) => onQueryChange(event.target.value)} />
      </AdminField>
      <AdminField label="Plan" htmlFor="subscriptions-plan" className="flex-[1_1_120px]">
        <AdminSelect id="subscriptions-plan" value={filters.plan} onChange={(event) => update({ plan: event.target.value as SubscriptionFilters["plan"] })}>
          <option value="">All</option>
          {plans.map((plan) => (
            <option key={plan} value={plan}>
              {plan}
            </option>
          ))}
        </AdminSelect>
      </AdminField>
      <AdminField label="Status" htmlFor="subscriptions-status" className="flex-[1_1_170px]">
        <AdminSelect id="subscriptions-status" value={filters.status} onChange={(event) => update({ status: event.target.value as SubscriptionFilters["status"] })}>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_FILTER_LABELS[status]}
            </option>
          ))}
        </AdminSelect>
      </AdminField>
      <AdminField label="Renews" htmlFor="subscriptions-due" className="flex-[1_1_130px]">
        <AdminSelect id="subscriptions-due" value={filters.due} onChange={(event) => update({ due: event.target.value as SubscriptionDue })}>
          {DUES.map((due) => (
            <option key={due} value={due}>
              {DUE_LABELS[due]}
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
