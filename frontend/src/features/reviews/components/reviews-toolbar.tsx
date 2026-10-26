"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS, starsLabel } from "../format";
import { RATINGS, type ReviewFilters, type ReviewSort } from "../types";

const SEARCH_DELAY_MS = 300;

type ReviewsToolbarProps = {
  filters: ReviewFilters;
  onChange: (filters: ReviewFilters) => void;
  // Changes when filters are cleared, so the search box empties.
  resetKey: number;
};

// Rating chips on the left; sort and search on the right. One row on desktop.
export function ReviewsToolbar({ filters, onChange, resetKey }: ReviewsToolbarProps) {
  const chips: { key: ReviewFilters["rating"]; label: string }[] = [
    { key: "all", label: "All" },
    ...RATINGS.map((rating) => ({ key: rating, label: starsLabel(rating) })),
  ];

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div role="group" aria-label="Filter by rating" className="flex flex-wrap gap-2">
        {chips.map(({ key, label }) => {
          const active = key === filters.rating;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ ...filters, rating: key })}
              className={cn(
                "focus-ring inline-flex h-11 items-center rounded-lg px-4 text-sm font-medium whitespace-nowrap transition-colors motion-reduce:transition-none md:h-9",
                active ? "bg-brand-tropical text-white" : "bg-office-chip text-foreground hover:bg-office-pill",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative">
          <label htmlFor="reviews-sort" className="sr-only">
            Sort reviews
          </label>
          <select
            id="reviews-sort"
            value={filters.sort}
            onChange={(event) => onChange({ ...filters, sort: event.target.value as ReviewSort })}
            className="focus-ring h-11 w-full cursor-pointer appearance-none rounded-lg border border-border bg-card pr-10 pl-3 text-sm text-foreground sm:w-44 md:h-10"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-office-icon" />
        </div>
        <SearchBox key={resetKey} initial={filters.query} onSearch={(query) => onChange({ ...filters, query })} />
      </div>
    </div>
  );
}

// Search box that reports what was typed after a short pause.
function SearchBox({ initial, onSearch }: { initial: string; onSearch: (query: string) => void }) {
  const [value, setValue] = useState(initial);
  const report = useRef(onSearch);
  useEffect(() => {
    report.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    if (value === initial) return;
    const timer = setTimeout(() => report.current(value), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [value, initial]);

  return (
    <div className="relative">
      <label htmlFor="reviews-search" className="sr-only">
        Search reviews
      </label>
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-office-icon" />
      <input
        id="reviews-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search reviews"
        autoComplete="off"
        className="focus-ring h-11 w-full rounded-lg border border-border bg-card pr-3 pl-9 text-sm text-foreground placeholder:text-office-muted sm:w-56 md:h-10"
      />
    </div>
  );
}
