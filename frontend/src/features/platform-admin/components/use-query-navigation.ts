"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

// Writes list state (filters, sort, page) to the URL. The pathname is kept,
// so an item open in a detail panel stays open while filtering. `toQuery`
// serialises the next state; `reset` names the fields a change resets.
const NO_RESET = {};

export function useQueryNavigation<T extends object>(current: T, toQuery: (next: T) => string, reset: Partial<T> = NO_RESET) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const update = useCallback(
    (changes: Partial<T>) => {
      const next = { ...current, ...reset, ...changes };
      startTransition(() => {
        router.replace(`${pathname}${toQuery(next)}`, { scroll: false });
      });
    },
    [current, pathname, reset, router, toQuery],
  );

  return { update, isPending };
}
