import Link from "next/link";
import { Info, X } from "lucide-react";
import { formatCount } from "@/lib/format/numbers";
import { PROPERTY_TYPE_PLURALS, SEARCH_PATH, propertyTypeLabel } from "../config";
import { directoryHref } from "../query";
import type { DirectoryQuery, DirectorySearchResult } from "../types";
import { DirectoryPropertyCard } from "./directory-property-card";
import { SortSelect } from "./sort-select";

type ActiveFilter = { label: string; href: string };

// Chips for the filters in the URL; each links to the URL without it.
function activeFilters(query: DirectoryQuery): ActiveFilter[] {
  const base = { ...query, page: 1 };
  return [
    ...(query.location ? [{ label: query.location, href: directoryHref({ ...base, location: "" }) }] : []),
    ...query.types.map((type) => ({
      label: propertyTypeLabel(type),
      href: directoryHref({ ...base, types: query.types.filter((other) => other !== type) }),
    })),
    ...(query.minRating ? [{ label: `${query.minRating.toFixed(1)}+ rating`, href: directoryHref({ ...base, minRating: null }) }] : []),
  ];
}

// "Guest houses, boutique villas · 4.5+ rating"
function filterSummary(query: DirectoryQuery) {
  const types = query.types.map((type, index) => {
    const plural = PROPERTY_TYPE_PLURALS[type];
    return index === 0 ? plural : plural.toLowerCase();
  });
  const parts = [types.join(", "), query.minRating ? `${query.minRating.toFixed(1)}+ rating` : ""].filter(Boolean);
  return parts.join(" · ");
}

export function DiscoverResults({ query, result }: { query: DirectoryQuery; result: DirectorySearchResult }) {
  const { properties, total } = result;
  const filters = activeFilters(query);
  const summary = filterSummary(query);
  const hasMore = properties.length < total;

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p aria-live="polite" className="text-xl font-semibold text-brand-tropical">
            {formatCount(total)} {total === 1 ? "property" : "properties"} in {query.location || "Sri Lanka"}
          </p>
          {summary ? <p className="mt-0.5 text-sm text-muted-foreground">{summary}</p> : null}
        </div>
        <SortSelect query={query} />
      </div>

      {filters.length > 0 ? (
        <ul aria-label="Active filters" className="mt-4 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <li key={filter.href}>
              <Link
                href={filter.href}
                scroll={false}
                className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-full bg-brand-aqua py-1 pr-3 pl-4 text-sm font-medium text-brand-tropical transition-colors hover:bg-brand-lagoon/60 motion-reduce:transition-none"
              >
                {filter.label}
                <X aria-hidden="true" className="size-4" />
                <span className="sr-only"> (remove filter)</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-4 flex items-start gap-2 rounded-2xl border border-brand-lagoon/60 bg-brand-aqua/50 px-4 py-3 text-sm text-brand-tropical">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-teal" />
        You book on each property&apos;s own website — prices include Sri Lankan taxes, itemised before you pay.
      </p>

      {properties.length > 0 ? (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <li key={property.slug}>
              <DirectoryPropertyCard property={property} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-brand-lagoon bg-white p-10 text-center">
          <p className="font-semibold text-brand-tropical">No stays match these filters.</p>
          <p className="mt-1 text-sm text-muted-foreground">Try another town or a lower minimum rating.</p>
          <Link
            href={SEARCH_PATH}
            scroll={false}
            className="focus-ring mt-4 inline-flex min-h-11 items-center rounded-full bg-brand-tropical px-5 text-sm font-medium text-white"
          >
            Clear all filters
          </Link>
        </div>
      )}

      {properties.length > 0 ? (
        <div className="mt-8 flex flex-col items-center gap-2">
          {hasMore ? (
            <Link
              href={directoryHref({ ...query, page: query.page + 1 })}
              scroll={false}
              className="focus-ring inline-flex min-h-12 items-center rounded-full border border-brand-tropical bg-white px-6 text-sm font-medium text-brand-tropical transition-colors hover:bg-brand-aqua motion-reduce:transition-none"
            >
              Load more properties
            </Link>
          ) : null}
          <p className="text-sm text-muted-foreground">
            Showing {formatCount(properties.length)} of {formatCount(total)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
