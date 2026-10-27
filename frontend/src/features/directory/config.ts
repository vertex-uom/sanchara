// Directory settings shared by the home page and the /properties search.
import type { DirectorySort, PropertyType } from "./types";

// Property types come from the API (GET /v1/directory/property-types); none
// are listed here.

// "Guest House" → "Guest house", for filter labels and chips.
export function propertyTypeLabel(type: PropertyType) {
  return type.name.charAt(0) + type.name.slice(1).toLowerCase();
}

// "Guest House" → "Guest houses", for the category chips and the results summary.
export function propertyTypePlural(type: PropertyType) {
  return `${propertyTypeLabel(type)}s`;
}

// Minimum-rating filter steps; the URL carries the value (minRating=4.5).
export const MIN_RATING_OPTIONS = [4, 4.5, 4.8] as const;

export const SORT_OPTIONS: { value: DirectorySort; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Highest rated" },
  { value: "reviews", label: "Most reviewed" },
];

export const DEFAULT_SORT: DirectorySort = "recommended";

// Results per page on /properties.
export const DIRECTORY_PAGE_SIZE = 9;

// Type tabs above the featured stays on /properties, besides "All". The tabs
// are the types of the featured stays themselves, most common first.
export const MAX_FEATURED_TYPE_TABS = 3;

// Featured stays fetched for /properties; the tabs narrow them in the page.
export const FEATURED_STAYS_LIMIT = 12;

// Cards in the home page carousel.
export const HOME_FEATURED_LIMIT = 6;

// Location hints for the search field; guests can still type a town.
export const SRI_LANKA_DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
  "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
  "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
  "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya",
] as const;

// TODO(confirm): v8 uses LKR for residents and USD for non-residents;
// the directory price-range currency is not decided yet.
export const PRICE_RANGE_CONFIG = { currency: "LKR" } as const;

export const SEARCH_PATH = "/properties";

export function propertyHref(slug: string) {
  return `${SEARCH_PATH}/${encodeURIComponent(slug)}`;
}
