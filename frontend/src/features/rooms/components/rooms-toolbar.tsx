"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_FILTERS, type RoomFilters, type StatusFilter } from "../filters";

type RoomsToolbarProps = {
  filters: RoomFilters;
  counts: Record<StatusFilter, number>;
  onChange: (filters: RoomFilters) => void;
};

// Search on the left, status chips on the right. Filters client-side.
export function RoomsToolbar({ filters, counts, onChange }: RoomsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 @xl:flex-row @xl:items-center @xl:justify-between">
      <div className="relative w-full min-w-0 @xl:max-w-sm @xl:flex-1">
        <label htmlFor="rooms-search" className="sr-only">
          Search room types or units
        </label>
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-office-icon" />
        <input
          id="rooms-search"
          type="search"
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          placeholder="Search room types or units..."
          autoComplete="off"
          className="focus-ring h-11 w-full rounded-lg border border-border bg-card pr-3 pl-9 text-sm text-foreground placeholder:text-office-muted md:h-10"
        />
      </div>

      <div role="group" aria-label="Filter by status" className="flex shrink-0 flex-wrap gap-2">
        {STATUS_FILTERS.map(({ key, label }) => {
          const active = key === filters.status;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ ...filters, status: key })}
              className={cn(
                "focus-ring inline-flex h-11 items-center rounded-lg px-4 text-sm font-medium whitespace-nowrap transition-colors motion-reduce:transition-none md:h-9",
                active ? "bg-brand-tropical text-white" : "bg-office-chip text-foreground hover:bg-office-pill",
              )}
            >
              {label} ({counts[key]})
            </button>
          );
        })}
      </div>
    </div>
  );
}
