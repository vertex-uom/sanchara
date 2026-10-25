import type { PROPERTY_TYPES } from "./config";

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export type FeaturedProperty = {
  slug: string;
  name: string;
  town: string;
  district: string;
  type: PropertyType;
  rating: number;
  imageUrl: string;
};

// A listing in the /properties directory.
export type DirectoryProperty = {
  slug: string;
  name: string;
  town: string;
  district: string;
  type: PropertyType;
  rating: number;
  reviewCount: number;
  featured: boolean;
  // The property's own booking site, e.g. "sunrisevilla.sanchara.lk".
  websiteHost: string;
  imageUrl: string;
};

export type DirectorySort = "recommended" | "rating" | "reviews";

// Filters parsed from the /properties URL.
export type DirectoryQuery = {
  location: string;
  types: PropertyType[];
  minRating: number | null;
  sort: DirectorySort;
  page: number;
};

export type DirectorySearchResult = {
  // Matches on the current page, at most DIRECTORY_PAGE_SIZE.
  properties: DirectoryProperty[];
  total: number;
  // Page shown (the requested page, clamped to pageCount) and number of pages.
  page: number;
  pageCount: number;
  // Matches per type, ignoring the type filter itself.
  typeCounts: Record<PropertyType, number>;
};

export type SearchParams = Record<string, string | string[] | undefined>;
