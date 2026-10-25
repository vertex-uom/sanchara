import { DEFAULT_SORT, MIN_RATING_OPTIONS, PROPERTY_TYPES, SEARCH_PATH, SORT_OPTIONS } from "./config";
import type { DirectoryQuery, DirectorySort, PropertyType, SearchParams } from "./types";

// Upper bound on the page number, so a hand-edited URL stays sane.
const MAX_PAGE = 50;

function all(value: string | string[] | undefined) {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function first(value: string | string[] | undefined) {
  return all(value)[0] ?? "";
}

function isPropertyType(value: string): value is PropertyType {
  return (PROPERTY_TYPES as readonly string[]).includes(value);
}

function isSort(value: string): value is DirectorySort {
  return SORT_OPTIONS.some((option) => option.value === value);
}

// Reads /properties?location&type&minRating&sort&page. Unknown or invalid
// values fall back to defaults; the home form's empty fields are ignored.
export function parseDirectoryQuery(params: SearchParams): DirectoryQuery {
  const minRating = Number(first(params.minRating));
  const sort = first(params.sort);
  const page = Number.parseInt(first(params.page), 10);

  return {
    location: first(params.location).trim().slice(0, 80),
    types: PROPERTY_TYPES.filter((type) => all(params.type).filter(isPropertyType).includes(type)),
    minRating: (MIN_RATING_OPTIONS as readonly number[]).includes(minRating) ? minRating : null,
    sort: isSort(sort) ? sort : DEFAULT_SORT,
    page: Number.isInteger(page) && page > 1 ? Math.min(page, MAX_PAGE) : 1,
  };
}

// Builds the /properties URL for a query. Defaults are left out to keep URLs short.
export function directoryHref(query: Partial<DirectoryQuery>) {
  const params = new URLSearchParams();
  if (query.location) params.set("location", query.location);
  for (const type of query.types ?? []) params.append("type", type);
  if (query.minRating) params.set("minRating", query.minRating.toFixed(1));
  if (query.sort && query.sort !== DEFAULT_SORT) params.set("sort", query.sort);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const search = params.toString();
  return search ? `${SEARCH_PATH}?${search}` : SEARCH_PATH;
}
