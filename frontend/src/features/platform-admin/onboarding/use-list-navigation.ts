"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ApplicationFilters } from "../types";
import { filtersToQuery } from "./search-params";

// Writes list state to the URL. Any filter change resets to page 1; the
// pathname is kept so an open application stays open while filtering.
export function useListNavigation(filters: ApplicationFilters) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const update = useCallback(
    (changes: Partial<ApplicationFilters>) => {
      const next = { ...filters, page: 1, ...changes };
      startTransition(() => {
        router.replace(`${pathname}${filtersToQuery(next)}`, { scroll: false });
      });
    },
    [filters, pathname, router],
  );

  return { update, isPending };
}
