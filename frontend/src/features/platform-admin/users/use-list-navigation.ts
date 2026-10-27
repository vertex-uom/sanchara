"use client";

import { useQueryNavigation } from "../components/use-query-navigation";
import type { StaffFilters } from "../types";
import { filtersToQuery } from "./search-params";

const RESET_PAGE = { page: 1 };
const toQuery = (next: StaffFilters) => filtersToQuery(next);

// Writes filter changes to the URL; every change restarts at page 1.
export function useListNavigation(filters: StaffFilters) {
  return useQueryNavigation(filters, toQuery, RESET_PAGE);
}
