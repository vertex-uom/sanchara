"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/format/numbers";
import { DEFAULT_SORT, MIN_RATING_OPTIONS, SEARCH_PATH, SRI_LANKA_DISTRICTS, propertyTypeLabel } from "../config";
import { directoryHref } from "../query";
import type { DirectoryQuery, PropertyTypeCount } from "../types";

type DiscoverFiltersProps = {
  query: DirectoryQuery;
  // Every active type, in catalogue order.
  typeCounts: PropertyTypeCount[];
  total: number;
};

const sectionTitleClass = "text-sm font-semibold text-brand-tropical";

// Filter sidebar on /properties. Checkboxes and rating apply at once; the
// location applies on Enter or "Show N properties". It is also a plain GET
// form, so it works before hydration. Collapsible below lg.
export function DiscoverFilters({ query, typeCounts, total }: DiscoverFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  // Local draft so typing doesn't navigate; reset whenever the URL changes
  // (chip removed, "Clear all", category chip).
  const queryKey = directoryHref(query);
  const [draft, setDraft] = useState(query);
  const [syncedKey, setSyncedKey] = useState(queryKey);
  if (queryKey !== syncedKey) {
    setSyncedKey(queryKey);
    setDraft(query);
  }

  function apply(next: DirectoryQuery) {
    setDraft(next);
    startTransition(() => router.replace(directoryHref({ ...next, page: 1 }), { scroll: false }));
  }

  function toggleType(code: string, checked: boolean) {
    const types = typeCounts
      .map((option) => option.code)
      .filter((option) => (option === code ? checked : draft.types.includes(option)));
    apply({ ...draft, types });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    apply({ ...draft, location: draft.location.trim() });
    setOpen(false);
  }

  return (
    <aside aria-labelledby="filters-title" className="lg:sticky lg:top-6">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="discover-filters"
        onClick={() => setOpen((value) => !value)}
        className="focus-ring flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-brand-lagoon bg-white px-4 text-sm font-semibold text-brand-tropical lg:hidden"
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal aria-hidden="true" className="size-4 text-brand-teal" />
          Filters
        </span>
        <ChevronDown aria-hidden="true" className={cn("size-4 transition-transform motion-reduce:transition-none", open && "rotate-180")} />
      </button>

      <form
        id="discover-filters"
        action={SEARCH_PATH}
        method="get"
        aria-busy={isPending}
        onSubmit={handleSubmit}
        className={cn(
          "mt-3 rounded-3xl border border-brand-lagoon/60 bg-white p-5 shadow-sm lg:mt-0 lg:block",
          open ? "block" : "hidden",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="filters-title" className="text-lg font-semibold text-brand-tropical">
            Filters
          </h2>
          <Link
            href={SEARCH_PATH}
            scroll={false}
            className="focus-ring inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-brand-tropical underline-offset-4 hover:underline"
          >
            Clear all
          </Link>
        </div>

        <div className="mt-4 border-t border-brand-lagoon/50 pt-4">
          <label htmlFor="filter-location" className={sectionTitleClass}>
            Location
          </label>
          <input
            id="filter-location"
            name="location"
            type="text"
            list="filter-districts"
            value={draft.location}
            onChange={(event) => setDraft({ ...draft, location: event.target.value })}
            placeholder="District or town, e.g. Galle"
            autoComplete="off"
            className="focus-ring mt-2 h-11 w-full rounded-xl border border-brand-lagoon bg-white px-3 text-sm text-brand-tropical placeholder:text-muted-foreground"
          />
          <datalist id="filter-districts">
            {SRI_LANKA_DISTRICTS.map((district) => (
              <option key={district} value={district} />
            ))}
          </datalist>
        </div>

        <fieldset className="mt-4 border-t border-brand-lagoon/50 pt-4">
          <legend className={cn(sectionTitleClass, "float-left w-full")}>Property type</legend>
          <ul className="clear-left mt-1 space-y-0.5 pt-1">
            {typeCounts.map((type) => (
              <li key={type.code}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 text-sm text-brand-tropical hover:bg-brand-aqua/60">
                  <input
                    type="checkbox"
                    name="type"
                    value={type.code}
                    checked={draft.types.includes(type.code)}
                    onChange={(event) => toggleType(type.code, event.target.checked)}
                    className="size-4 shrink-0 cursor-pointer accent-brand-tropical"
                  />
                  <span className="flex-1">{propertyTypeLabel(type)}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatCount(type.count)}
                    <span className="sr-only"> properties</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset className="mt-4 border-t border-brand-lagoon/50 pt-4">
          <legend className={cn(sectionTitleClass, "float-left w-full")}>Minimum rating</legend>
          <div className="clear-left grid grid-cols-4 gap-1 pt-3">
            {[null, ...MIN_RATING_OPTIONS].map((rating) => {
              const label = rating === null ? "Any" : `${rating.toFixed(1)}+`;
              return (
                <label key={label} className="relative">
                  <input
                    type="radio"
                    name="minRating"
                    value={rating?.toFixed(1) ?? ""}
                    checked={draft.minRating === rating}
                    onChange={() => apply({ ...draft, minRating: rating })}
                    className="peer sr-only"
                  />
                  <span className="flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-brand-lagoon text-sm font-medium text-brand-tropical transition-colors peer-checked:border-brand-tropical peer-checked:bg-brand-tropical peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-teal hover:bg-brand-aqua peer-checked:hover:bg-brand-tropical motion-reduce:transition-none">
                    {label}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Keeps the chosen sort when the form is submitted without JS. */}
        {draft.sort !== DEFAULT_SORT ? <input type="hidden" name="sort" value={draft.sort} /> : null}

        <button
          type="submit"
          className="focus-ring mt-6 flex min-h-12 w-full items-center justify-center rounded-full bg-linear-to-r from-brand-tropical via-brand-tropical to-brand-teal px-6 text-sm font-medium text-white shadow-md"
        >
          {isPending ? "Updating…" : `Show ${formatCount(total)} ${total === 1 ? "property" : "properties"}`}
        </button>
      </form>
    </aside>
  );
}
