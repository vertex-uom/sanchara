"use client";

import { useQueryNavigation } from "../components/use-query-navigation";
import type { SubscriptionFilters } from "../types";
import { filtersToQuery } from "./search-params";

const RESET_PAGE = { page: 1 };
const toQuery = (next: SubscriptionFilters) => filtersToQuery(next);

// Writes filter changes to the URL; every change restarts at page 1.
export function useListNavigation(filters: SubscriptionFilters) {
  return useQueryNavigation(filters, toQuery, RESET_PAGE);
}
