"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FEATURED_TABS } from "../config";
import type { DirectoryProperty } from "../types";
import { DirectoryPropertyCard } from "./directory-property-card";

// Most cards shown at once; matches the four-column row on wide screens.
const MAX_CARDS = 4;

// Heading on the left, type tabs on the right, then the featured cards.
// Tabs only narrow the list already on the page, so they don't touch the URL.
export function FeaturedStaysTabs({ heading, properties }: { heading: ReactNode; properties: DirectoryProperty[] }) {
  const [activeLabel, setActiveLabel] = useState(FEATURED_TABS[0].label);
  const activeTab = FEATURED_TABS.find((tab) => tab.label === activeLabel) ?? FEATURED_TABS[0];
  const shown = properties
    .filter((property) => activeTab.types === null || activeTab.types.includes(property.type))
    .slice(0, MAX_CARDS);

  return (
    <>
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        {heading}
        <div role="group" aria-label="Filter featured stays" className="flex flex-wrap gap-2">
          {FEATURED_TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              aria-pressed={tab.label === activeLabel}
              onClick={() => setActiveLabel(tab.label)}
              className={cn(
                "focus-ring min-h-11 rounded-full border px-4 text-sm font-medium transition-colors motion-reduce:transition-none",
                tab.label === activeLabel
                  ? "border-brand-tropical bg-brand-tropical text-white"
                  : "border-brand-lagoon bg-white text-brand-tropical hover:bg-brand-aqua",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {shown.length > 0 ? (
        <ul aria-live="polite" className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {shown.map((property) => (
            <li key={property.slug}>
              <DirectoryPropertyCard property={property} />
            </li>
          ))}
        </ul>
      ) : (
        <p aria-live="polite" className="mt-8 rounded-3xl border border-dashed border-brand-lagoon p-8 text-center text-sm text-muted-foreground">
          No featured {activeTab.label.toLowerCase()} right now.
        </p>
      )}
    </>
  );
}
