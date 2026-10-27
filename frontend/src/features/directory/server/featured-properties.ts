import "server-only";
import { HOME_FEATURED_LIMIT } from "../config";
import type { FeaturedProperty } from "../types";
import { getFeaturedStays } from "./directory-properties";

// The home page carousel: the top featured placements.
export async function getFeaturedProperties(): Promise<FeaturedProperty[]> {
  return getFeaturedStays(HOME_FEATURED_LIMIT);
}
