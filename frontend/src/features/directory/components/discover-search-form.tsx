import type { ReactNode } from "react";
import { ChevronDown, House, MapPin, Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { MIN_RATING_OPTIONS, PROPERTY_TYPES, SEARCH_PATH, SRI_LANKA_DISTRICTS } from "../config";
import type { DirectoryQuery } from "../types";
import { SearchDivider, SearchField, searchControlClass } from "./search-field";

// Plain GET form at the top of /properties: location, type and minimum rating.
// Pre-filled from the current URL; submitting starts a new search.
export function DiscoverSearchForm({ query }: { query?: DirectoryQuery }) {
  const type = query?.types.length === 1 ? query.types[0] : "";

  return (
    <form
      action={SEARCH_PATH}
      method="get"
      role="search"
      aria-label="Search stays"
      className="glass flex flex-col gap-1 rounded-3xl bg-white/85 p-2 shadow-xl md:flex-row md:items-center md:rounded-full"
    >
      <SearchField icon={MapPin} label="Location" htmlFor="discover-location">
        <input
          id="discover-location"
          name="location"
          type="text"
          list="discover-districts"
          defaultValue={query?.location}
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
          <select id="discover-type" name="type" defaultValue={type} className={selectClass}>
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
            defaultValue={query?.minRating?.toFixed(1) ?? ""}
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

      <button
        type="submit"
        className="focus-ring mt-1 flex min-h-12 items-center justify-between gap-6 rounded-full bg-linear-to-r from-brand-tropical via-brand-tropical to-brand-teal px-6 text-base font-medium text-white shadow-md md:mt-0 md:w-56 md:shrink-0"
      >
        Search
        <Search aria-hidden="true" className="size-5" />
      </button>
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
