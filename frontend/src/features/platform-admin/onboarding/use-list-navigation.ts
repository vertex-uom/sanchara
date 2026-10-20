"use client";

import { useQueryNavigation } from "../components/use-query-navigation";
import type { ApplicationFilters } from "../types";
import { filtersToQuery } from "./search-params";

const RESET_PAGE: Partial<ApplicationFilters> = { page: 1 };
const toQuery = (next: ApplicationFilters) => filtersToQuery(next);

// Any filter change resets to page 1.
export function useListNavigation(filters: ApplicationFilters) {
  return useQueryNavigation(filters, toQuery, RESET_PAGE);
}
