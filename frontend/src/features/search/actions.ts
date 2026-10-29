"use server";

import { getCurrentStaff } from "@/lib/auth/current-staff";
import { SEARCH_MIN_LENGTH } from "./config";
import { searchProperty } from "./server/search";
import type { SearchResults } from "./types";

const EMPTY: SearchResults = { reservations: [], guests: [] };

// Header search for the current property. Every signed-in role may search;
// the API decides what each one sees.
export async function searchAction(propertyId: string, query: string): Promise<SearchResults> {
  await getCurrentStaff();
  const trimmed = query.trim().slice(0, 100);
  if (trimmed.length < SEARCH_MIN_LENGTH) return EMPTY;
  return searchProperty(propertyId, trimmed);
}
