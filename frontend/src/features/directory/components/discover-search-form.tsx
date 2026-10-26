"use client";

import { useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, House, MapPin, Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_SORT, MIN_RATING_OPTIONS, PROPERTY_TYPES, SEARCH_PATH, SRI_LANKA_DISTRICTS } from "../config";
import { directoryHref } from "../query";
import type { DirectoryQuery, PropertyType } from "../types";
import { SearchDivider, SearchField, searchControlClass } from "./search-field";

const EMPTY_QUERY: DirectoryQuery = { location: "", name: "", types: [], minRating: null, sort: DEFAULT_SORT, page: 1 };

// A reload of /properties starts a clean search. Checked once per document, so
// client-side visits later in the session keep their filters.
let reloadChecked = false;

function isReloadOf(pathname: string) {
  if (reloadChecked) return false;
  reloadChecked = true;
  const [entry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  return entry?.type === "reload" && new URL(entry.name).pathname === pathname;
}

function isDistrict(value: string) {
  const needle = value.trim().toLowerCase();
  return SRI_LANKA_DISTRICTS.some((district) => district.toLowerCase() === needle);
}

// Search bar at the top of /properties: location, type and minimum rating.
// The URL is the source of truth, so it stays in sync with the sidebar and
// chips. Type and rating apply at once; the location applies when a district
// is picked, the field is cleared, or on Enter / Search. It is also a plain
// GET form, so it works before hydration. The property name applies only on
// Enter or the search icon.
export function DiscoverSearchForm({ query = EMPTY_QUERY }: { query?: DirectoryQuery }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  // Local draft so the controls change at once and typing doesn't navigate;
  // reset whenever the URL changes (sidebar, chips, "Clear all").
  const queryKey = directoryHref(query);
  const [draft, setDraft] = useState(query);
  const [syncedKey, setSyncedKey] = useState(queryKey);
  if (queryKey !== syncedKey) {
    setSyncedKey(queryKey);
    setDraft(query);
  }

  useEffect(() => {
    if (isReloadOf(pathname) && window.location.search) {
      router.replace(SEARCH_PATH, { scroll: false });
    }
  }, [pathname, router]);

  function apply(next: DirectoryQuery) {
    setDraft(next);
    startTransition(() => router.replace(directoryHref({ ...next, page: 1 }), { scroll: false }));
  }

  function changeLocation(location: string) {
    const next = { ...draft, location };
    if (location.trim() === "" || isDistrict(location)) apply({ ...next, location: location.trim() });
    else setDraft(next);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    apply({ ...draft, location: draft.location.trim(), name: draft.name.trim() });
  }

  const type = draft.types.length === 1 ? draft.types[0] : "";

  return (
    <form
      action={SEARCH_PATH}
      method="get"
      role="search"
      aria-label="Search stays"
      onSubmit={handleSubmit}
      className="glass flex flex-col gap-1 rounded-3xl bg-white/85 p-2 shadow-xl md:flex-row md:items-center md:rounded-full"
    >
      <SearchField icon={MapPin} label="Location" htmlFor="discover-location">
        <input
          id="discover-location"
          name="location"
          type="text"
          list="discover-districts"
          value={draft.location}
          onChange={(event) => changeLocation(event.target.value)}
          placeholder="Search district or town"
          autoComplete="off"
          className={searchControlClass}
        />
        <datalist id="discover-districts">
          {SRI_LANKA_DISTRICTS.map((district) => (
            <option key={district} value={district} />
          ))}
        </datalist>
      </SearchField>

      <SearchDivider />

      <SearchField icon={House} label="Property type" htmlFor="discover-type">
        <SelectShell>
          <select
            id="discover-type"
            name="type"
            value={type}
            onChange={(event) => apply({ ...draft, types: event.target.value ? [event.target.value as PropertyType] : [] })}
            className={selectClass}
          >
            <option value="">Any type</option>
            {PROPERTY_TYPES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </SelectShell>
      </SearchField>

      <SearchDivider />

      <SearchField icon={Star} label="Minimum rating" htmlFor="discover-rating">
        <SelectShell>
          <select
            id="discover-rating"
            name="minRating"
            value={draft.minRating?.toFixed(1) ?? ""}
            onChange={(event) => apply({ ...draft, minRating: event.target.value ? Number(event.target.value) : null })}
            className={selectClass}
          >
            <option value="">Any rating</option>
            {MIN_RATING_OPTIONS.map((rating) => (
              <option key={rating} value={rating.toFixed(1)}>
                {rating.toFixed(1)}+
              </option>
            ))}
          </select>
        </SelectShell>
      </SearchField>

      <div className="mt-1 flex min-h-12 items-center justify-between gap-6 rounded-full focus-within:ring-2 focus-within:ring-brand-lagoon bg-linear-to-r from-brand-tropical via-brand-tropical to-brand-teal px-6 text-base font-medium text-white shadow-md md:mt-0 md:w-56 md:shrink-0">
        <input
          name="name"
          type="search"
          aria-label="Property name"
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          placeholder="Search property name..."
          autoComplete="off"
          className="w-full min-w-0 bg-transparent text-white outline-none placeholder:text-white/80 [&::-webkit-search-cancel-button]:hidden"
        />
        <button type="submit" aria-label="Search" className="focus-ring shrink-0 rounded-full">
          <Search aria-hidden="true" className="size-5" />
        </button>
      </div>
    </form>
  );
}

// appearance-none drops the native inset so the value lines up with its label.
const selectClass = cn(searchControlClass, "cursor-pointer appearance-none pr-6");

function SelectShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-0 size-4 -translate-y-1/2 text-brand-tropical"
      />
    </div>
  );
}
