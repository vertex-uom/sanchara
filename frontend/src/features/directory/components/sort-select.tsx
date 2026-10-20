"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { SORT_OPTIONS } from "../config";
import { directoryHref } from "../query";
import type { DirectoryQuery, DirectorySort } from "../types";

// "Sort: Recommended" above the results. Stores the sort in the URL.
export function SortSelect({ query }: { query: DirectoryQuery }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Shows the new choice at once; follows the URL when it changes elsewhere.
  const [value, setValue] = useState(query.sort);
  const [syncedSort, setSyncedSort] = useState(query.sort);
  if (query.sort !== syncedSort) {
    setSyncedSort(query.sort);
    setValue(query.sort);
  }

  function handleChange(next: DirectorySort) {
    setValue(next);
    startTransition(() => router.replace(directoryHref({ ...query, sort: next, page: 1 }), { scroll: false }));
  }

  return (
    <div className="relative inline-flex items-center gap-2 text-sm text-brand-tropical">
      <label htmlFor="discover-sort" className="font-medium">
        Sort:
      </label>
      <div className="relative">
        <select
          id="discover-sort"
          value={value}
          aria-busy={isPending}
          onChange={(event) => handleChange(event.target.value as DirectorySort)}
          className="focus-ring h-11 cursor-pointer appearance-none rounded-full border border-brand-lagoon bg-white py-1 pr-9 pl-4 font-medium text-brand-tropical"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
      </div>
    </div>
  );
}
