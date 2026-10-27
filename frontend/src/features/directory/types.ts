// A property type from the database (property_types). The code goes in URLs
// and API calls; the name is shown.
export type PropertyType = { code: string; name: string };

// A type with its number of matches, as in the search result.
export type PropertyTypeCount = PropertyType & { count: number };

// A listing in the /properties directory (GET /v1/directory/properties).
export type DirectoryProperty = {
  slug: string;
  name: string;
  town: string;
  district: string;
  type: PropertyType;
  // Average of published reviews, one decimal; null before the first review.
  rating: number | null;
  reviewCount: number;
  featured: boolean;
  // The property's own booking site, e.g. "sunrisevilla.sanchara.lk".
  websiteHost: string;
  // Cover photo: a site-relative path or an https URL; null when there is none.
  imageUrl: string | null;
};

// A card in the home page carousel.
export type FeaturedProperty = Pick<DirectoryProperty, "slug" | "name" | "town" | "district" | "type" | "rating" | "imageUrl">;

export type DirectorySort = "recommended" | "rating" | "reviews";

// Filters parsed from the /properties URL.
export type DirectoryQuery = {
  location: string;
  // Part of a property name, matched case-insensitively.
  name: string;
  // Property type codes, in catalogue order.
  types: string[];
  minRating: number | null;
  sort: DirectorySort;
  page: number;
};

export type DirectorySearchResult = {
  // Matches on the current page, at most the requested page size.
  properties: DirectoryProperty[];
  total: number;
  // Page shown (the requested page, clamped to pageCount) and number of pages.
  page: number;
  pageCount: number;
  // Every active type in catalogue order, with matches ignoring the type filter itself.
  typeCounts: PropertyTypeCount[];
};

export type SearchParams = Record<string, string | string[] | undefined>;
