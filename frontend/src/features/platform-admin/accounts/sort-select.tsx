"use client";

import { ArrowUpDown } from "lucide-react";
import { AdminSelect } from "../components/form";
import { ICON_STROKE } from "../sidebar-modes";
import type { CompanyFilters } from "../types";
import { SORT_LABELS } from "./search-params";
import { useListNavigation } from "./use-list-navigation";

const SORTS = Object.keys(SORT_LABELS) as CompanyFilters["sort"][];

export function SortSelect({ filters }: { filters: CompanyFilters }) {
  const { update } = useListNavigation(filters);
  return (
    <label className="relative block w-[150px]">
      <span className="sr-only">Sort companies</span>
      <ArrowUpDown aria-hidden="true" strokeWidth={ICON_STROKE} className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-admin-icon" />
      <AdminSelect value={filters.sort} onChange={(event) => update({ sort: event.target.value as CompanyFilters["sort"] })} className="pl-9 font-medium">
        {SORTS.map((sort) => (
          <option key={sort} value={sort}>
            {SORT_LABELS[sort]}
          </option>
        ))}
      </AdminSelect>
    </label>
  );
}
