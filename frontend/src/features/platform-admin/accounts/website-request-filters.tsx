"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { AdminField, AdminInput, AdminSelect } from "../components/form";
import { useQueryNavigation } from "../components/use-query-navigation";
import type { WebsiteRequestAssignee, WebsiteRequestFilters } from "../types";
import { WEBSITE_REQUEST_STATUS_FILTERS, websiteRequestsQuery } from "./search-params";
import { WEBSITE_REQUEST_STATUS_META } from "./status";

const SEARCH_DEBOUNCE_MS = 300;

// Search plus Status and Assigned-to selects for the Website requests tab.
export function WebsiteRequestFiltersBar({ filters, assignees }: { filters: WebsiteRequestFilters; assignees: WebsiteRequestAssignee[] }) {
  const { update, isPending } = useQueryNavigation(filters, websiteRequestsQuery);
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
    update({ q: "", status: "all", assignee: "" });
  };

  const active = Boolean(filters.q || filters.status !== "all" || filters.assignee || query);

  return (
    <form
      role="search"
      aria-label="Filter website requests"
      aria-busy={isPending || undefined}
      onSubmit={(event) => {
        event.preventDefault();
        clearTimeout(timer.current ?? undefined);
        update({ q: query.trim() });
      }}
      className="flex flex-wrap items-end gap-3 rounded-[14px] border border-admin-border bg-admin-card p-4"
    >
      <AdminField label="Search" htmlFor="website-requests-search" className="min-w-50 flex-[2_1_220px]">
        <AdminInput id="website-requests-search" type="search" icon={Search} placeholder="Search company, town, owner or ID…" value={query} onChange={(event) => onQueryChange(event.target.value)} />
      </AdminField>
      <AdminField label="Status" htmlFor="website-requests-status" className="flex-[1_1_150px]">
        <AdminSelect id="website-requests-status" value={filters.status} onChange={(event) => update({ status: event.target.value as WebsiteRequestFilters["status"] })}>
          {WEBSITE_REQUEST_STATUS_FILTERS.map((status) => (
            <option key={status} value={status}>
              {status === "all" ? "All" : WEBSITE_REQUEST_STATUS_META[status].label}
            </option>
          ))}
        </AdminSelect>
      </AdminField>
      <AdminField label="Assigned to" htmlFor="website-requests-assignee" className="flex-[1_1_170px]">
        <AdminSelect id="website-requests-assignee" value={filters.assignee} onChange={(event) => update({ assignee: event.target.value })}>
          <option value="">Anyone</option>
          <option value="unassigned">Unassigned</option>
          {assignees.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </AdminSelect>
      </AdminField>
      <button
        type="button"
        onClick={reset}
        disabled={!active}
        className="focus-ring h-9.5 rounded-md px-2 text-[12.5px] font-medium text-admin-primary hover:underline disabled:text-admin-muted-text disabled:no-underline"
      >
        Reset
      </button>
    </form>
  );
}
