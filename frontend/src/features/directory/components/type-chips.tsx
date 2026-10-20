import Link from "next/link";
import { cn } from "@/lib/utils";
import { PROPERTY_TYPE_PLURALS, PROPERTY_TYPES } from "../config";
import { directoryHref } from "../query";
import type { DirectoryQuery, PropertyType } from "../types";

const chipClass =
  "focus-ring inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors motion-reduce:transition-none";

// Category row above the directory: one type at a time, keeping the other filters.
export function TypeChips({ query }: { query: DirectoryQuery }) {
  const chips: { label: string; types: PropertyType[]; active: boolean }[] = [
    { label: "All properties", types: [], active: query.types.length === 0 },
    ...PROPERTY_TYPES.map((type) => ({
      label: PROPERTY_TYPE_PLURALS[type],
      types: [type],
      active: query.types.length === 1 && query.types[0] === type,
    })),
  ];

  return (
    <nav aria-label="Property categories">
      {/* Scrolls sideways on phones; the negative margin lets it reach the screen edge. */}
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {chips.map((chip) => (
          <li key={chip.label}>
            <Link
              href={directoryHref({ ...query, types: chip.types, page: 1 })}
              aria-current={chip.active ? "true" : undefined}
              scroll={false}
              className={cn(
                chipClass,
                chip.active
                  ? "border-brand-tropical bg-brand-tropical text-white"
                  : "border-brand-lagoon bg-white text-brand-tropical hover:bg-brand-aqua",
              )}
            >
              {chip.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
