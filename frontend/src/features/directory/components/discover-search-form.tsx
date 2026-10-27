"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { House, MapPin, Search, Star } from "lucide-react";
import { DEFAULT_SORT, MIN_RATING_OPTIONS, PROPERTY_TYPES, SEARCH_PATH, SRI_LANKA_DISTRICTS } from "../config";
import { directoryHref } from "../query";
import type { DirectoryQuery, PropertyType } from "../types";
import { LocationCombobox, SearchSelect } from "./search-dropdowns";
import { SearchDivider, SearchField } from "./search-field";

const EMPTY_QUERY: DirectoryQuery = { location: "", name: "", types: [], minRating: null, sort: DEFAULT_SORT, page: 1 };

// A reload of /properties starts a clean search. Checked once per document, so
// client-side visits later in the session keep their filters.
let reloadChecked = false;

const TYPE_OPTIONS = PROPERTY_TYPES.map((type) => ({ value: type, label: type }));
const RATING_OPTIONS = MIN_RATING_OPTIONS.map((rating) => ({ value: rating.toFixed(1), label: `${rating.toFixed(1)}+` }));

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
// is picked or typed in full, and is removed when the field is cleared or
// edited away from that district. It is also a plain
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
  // Text in the location field; draft.location is the applied district.
  const [locationText, setLocationText] = useState(query.location);
  const [syncedKey, setSyncedKey] = useState(queryKey);
  // Last URL this form navigated to; other URL changes also reset the text.
  const [appliedKey, setAppliedKey] = useState(queryKey);
  if (queryKey !== syncedKey) {
    setSyncedKey(queryKey);
    if (queryKey !== appliedKey) setLocationText(query.location);
    setDraft(query);
  }

  useEffect(() => {
    if (isReloadOf(pathname) && window.location.search) {
      router.replace(SEARCH_PATH, { scroll: false });
    }
  }, [pathname, router]);

  function apply(next: DirectoryQuery) {
    const href = directoryHref({ ...next, page: 1 });
    setDraft(next);
    setAppliedKey(href);
    startTransition(() => router.replace(href, { scroll: false }));
  }

  // The combobox passes an exact district match in its listed spelling.
  function changeLocation(text: string) {
    setLocationText(text);
    const location = text.trim();
    const next = location === "" || isDistrict(location) ? location : "";
    if (next !== draft.location) apply({ ...draft, location: next });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    apply({ ...draft, location: locationText.trim(), name: draft.name.trim() });
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
        <LocationCombobox
          id="discover-location"
          name="location"
          value={locationText}
          onValueChange={changeLocation}
          placeholder="Select district"
          options={SRI_LANKA_DISTRICTS}
        />
      </SearchField>

      <SearchDivider />

      <SearchField icon={House} label="Property type" htmlFor="discover-type">
        <SearchSelect
          id="discover-type"
          name="type"
          anyLabel="Any type"
          options={TYPE_OPTIONS}
          value={type}
          onValueChange={(value) => apply({ ...draft, types: value ? [value as PropertyType] : [] })}
        />
      </SearchField>

      <SearchDivider />

      <SearchField icon={Star} label="Minimum rating" htmlFor="discover-rating">
        <SearchSelect
          id="discover-rating"
          name="minRating"
          anyLabel="Any rating"
          options={RATING_OPTIONS}
          value={draft.minRating?.toFixed(1) ?? ""}
          onValueChange={(value) => apply({ ...draft, minRating: value ? Number(value) : null })}
        />
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
