"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MAX_FEATURED_TYPE_TABS, propertyTypePlural } from "../config";
import type { DirectoryProperty } from "../types";
import { DirectoryPropertyCard } from "./directory-property-card";

// Most cards shown at once; matches the four-column row on wide screens.
const MAX_CARDS = 4;

type Tab = { label: string; code: string | null };

// "All", then the most common types among the featured stays (ties keep rank order).
function tabsFor(properties: DirectoryProperty[]): Tab[] {
  const counts = new Map<string, { tab: Tab; count: number }>();
  for (const { type } of properties) {
    const entry = counts.get(type.code) ?? { tab: { label: propertyTypePlural(type), code: type.code }, count: 0 };
    entry.count += 1;
    counts.set(type.code, entry);
  }
  const typeTabs = [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_FEATURED_TYPE_TABS)
    .map((entry) => entry.tab);
  return [{ label: "All", code: null }, ...typeTabs];
}

// Heading on the left, type tabs on the right, then the featured cards.
// Tabs only narrow the list already on the page, so they don't touch the URL.
export function FeaturedStaysTabs({ heading, properties }: { heading: ReactNode; properties: DirectoryProperty[] }) {
  const tabs = tabsFor(properties);
  const [activeLabel, setActiveLabel] = useState(tabs[0].label);
  const activeTab = tabs.find((tab) => tab.label === activeLabel) ?? tabs[0];
  const shown = properties
    .filter((property) => activeTab.code === null || property.type.code === activeTab.code)
    .slice(0, MAX_CARDS);

  return (
    <>
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        {heading}
        {tabs.length > 2 ? (
          <div role="group" aria-label="Filter featured stays" className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                type="button"
                aria-pressed={tab.label === activeTab.label}
                onClick={() => setActiveLabel(tab.label)}
                className={cn(
                  "focus-ring min-h-11 rounded-full border px-4 text-sm font-medium transition-colors motion-reduce:transition-none",
                  tab.label === activeTab.label
                    ? "border-brand-tropical bg-brand-tropical text-white"
                    : "border-brand-lagoon bg-white text-brand-tropical hover:bg-brand-aqua",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}
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
          No featured stays right now.
        </p>
      )}
    </>
  );
}
