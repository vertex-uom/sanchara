import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Info, X } from "lucide-react";
import { formatCount } from "@/lib/format/numbers";
import { DIRECTORY_PAGE_SIZE, PROPERTY_TYPE_PLURALS, SEARCH_PATH, propertyTypeLabel } from "../config";
import { directoryHref } from "../query";
import type { DirectoryQuery, DirectorySearchResult } from "../types";
import { DirectoryPropertyCard } from "./directory-property-card";
import { SortSelect } from "./sort-select";

type ActiveFilter = { label: string; href: string };

// Page links jump here, so the new page starts at the top of the results.
const RESULTS_ID = "results";

// Page numbers to show: first, last, and the current page ±1, with gaps
// ("gap") where pages are skipped. 1 … 4 5 6 … 12
function pageItems(page: number, pageCount: number): (number | "gap")[] {
  const pages = [...new Set([1, page - 1, page, page + 1, pageCount])]
    .filter((n) => n >= 1 && n <= pageCount)
    .sort((a, b) => a - b);
  return pages.flatMap((n, index) => {
    const previous = pages[index - 1];
    if (previous === undefined || n === previous + 1) return [n];
    // A single skipped page is shown as its number rather than a gap.
    return n === previous + 2 ? [previous + 1, n] : ["gap", n];
  });
}

const pageButtonClass =
  "focus-ring inline-flex size-11 items-center justify-center rounded-full text-sm font-medium transition-colors motion-reduce:transition-none";
const stepButtonClass =
  "focus-ring inline-flex min-h-11 items-center gap-1 rounded-full border px-4 text-sm font-medium transition-colors motion-reduce:transition-none";

function Pagination({ query, page, pageCount }: { query: DirectoryQuery; page: number; pageCount: number }) {
  const href = (target: number) => `${directoryHref({ ...query, page: target })}#${RESULTS_ID}`;

  const step = (target: number, label: string, icon: ReactNode, iconFirst: boolean) => {
    const content = iconFirst ? <>{icon}{label}</> : <>{label}{icon}</>;
    return target < 1 || target > pageCount ? (
      <span aria-disabled="true" className={`${stepButtonClass} cursor-not-allowed border-border bg-white text-muted-foreground opacity-60`}>
        {content}
      </span>
    ) : (
      <Link
        href={href(target)}
        className={`${stepButtonClass} border-brand-tropical bg-white text-brand-tropical hover:bg-brand-aqua`}
      >
        {content}
      </Link>
    );
  };

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2">
      {step(page - 1, "Previous", <ChevronLeft aria-hidden="true" className="size-4" />, true)}
      <ol className="flex flex-wrap items-center justify-center gap-1">
        {pageItems(page, pageCount).map((item, index) =>
          item === "gap" ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-sm text-muted-foreground">
              …
            </li>
          ) : (
            <li key={item}>
              {item === page ? (
                <span aria-current="page" className={`${pageButtonClass} bg-brand-tropical text-white`}>
                  <span className="sr-only">Page </span>
                  {item}
                </span>
              ) : (
                <Link href={href(item)} className={`${pageButtonClass} text-brand-tropical hover:bg-brand-aqua`}>
                  <span className="sr-only">Page </span>
                  {item}
                </Link>
              )}
            </li>
          ),
        )}
      </ol>
      {step(page + 1, "Next", <ChevronRight aria-hidden="true" className="size-4" />, false)}
    </nav>
  );
}

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
  const { properties, total, page, pageCount } = result;
  const filters = activeFilters(query);
  const summary = filterSummary(query);
  const firstShown = (page - 1) * DIRECTORY_PAGE_SIZE + 1;

  return (
    <div id={RESULTS_ID} className="min-w-0 scroll-mt-6">
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
          <p className="font-semibold text-brand-tropical">No properties found</p>
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
        <div className="mt-8 flex flex-col items-center gap-3">
          {pageCount > 1 ? <Pagination query={query} page={page} pageCount={pageCount} /> : null}
          <p className="text-sm text-muted-foreground">
            Showing {formatCount(firstShown)}–{formatCount(firstShown + properties.length - 1)} of {formatCount(total)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
