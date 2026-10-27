// Directory settings shared by the home page and the /properties search.
import type { DirectorySort, PropertyType } from "./types";

// Types from the Discover design. Replace with the confirmed v8 property types.
export const PROPERTY_TYPES = [
  "Guest House",
  "Home Stay",
  "Boutique Villa",
  "Bungalow",
  "Surf Camp",
  "Wellness Retreat",
] as const;

// Plural labels for the category chips and the results summary.
export const PROPERTY_TYPE_PLURALS: Record<PropertyType, string> = {
  "Guest House": "Guest houses",
  "Home Stay": "Home stays",
  "Boutique Villa": "Boutique villas",
  Bungalow: "Bungalows",
  "Surf Camp": "Surf camps",
  "Wellness Retreat": "Wellness retreats",
};

// "Guest House" → "Guest house", for filter labels and chips.
export function propertyTypeLabel(type: PropertyType) {
  return type.charAt(0) + type.slice(1).toLowerCase();
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

// Tabs above the featured stays on /properties.
export const FEATURED_TABS: { label: string; types: PropertyType[] | null }[] = [
  { label: "All", types: null },
  { label: "Guest houses", types: ["Guest House"] },
  { label: "Villas", types: ["Boutique Villa"] },
  { label: "Surf camps", types: ["Surf Camp"] },
];

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
