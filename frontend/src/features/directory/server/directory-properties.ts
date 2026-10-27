import "server-only";
import { cache } from "react";
import { apiFetch } from "@/lib/api-client/server";
import { DIRECTORY_PAGE_SIZE, FEATURED_STAYS_LIMIT } from "../config";
import type { DirectoryProperty, DirectoryQuery, DirectorySearchResult, PropertyType, PropertyTypeCount } from "../types";

// The public directory API (docs/directory-api-contract.md). No sign-in; the
// API already hides unlisted properties and suspended companies.

// GET /v1/directory/properties.
type SearchResponse = {
  items: DirectoryProperty[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  typeCounts: PropertyTypeCount[];
};

// Active property types in catalogue order. Cached per request: the hero and
// the results both read it.
export const getPropertyTypes = cache(() => apiFetch<PropertyType[]>("/v1/directory/property-types"));

// One page of the directory. Defaults are left out, as in directoryHref.
export async function searchDirectory(query: DirectoryQuery, pageSize = DIRECTORY_PAGE_SIZE): Promise<DirectorySearchResult> {
  const params = new URLSearchParams();
  if (query.location) params.set("location", query.location);
  if (query.name) params.set("name", query.name);
  for (const type of query.types) params.append("type", type);
  if (query.minRating !== null) params.set("minRating", String(query.minRating));
  params.set("sort", query.sort);
  params.set("page", String(query.page));
  params.set("pageSize", String(pageSize));

  const { items, total, page, pageCount, typeCounts } = await apiFetch<SearchResponse>(`/v1/directory/properties?${params}`);
  return { properties: items, total, page, pageCount, typeCounts };
}

// Featured placements, in rank order.
export async function getFeaturedStays(limit = FEATURED_STAYS_LIMIT): Promise<DirectoryProperty[]> {
  return apiFetch<DirectoryProperty[]>(`/v1/directory/featured?limit=${limit}`);
}
