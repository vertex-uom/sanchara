"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { CalendarX2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

type Tab = "check" | "blocks";

const TABS: { key: Tab; label: string }[] = [
  { key: "check", label: "Check availability" },
  { key: "blocks", label: "Date blocks" },
];

type AvailabilityWorkspaceProps = {
  place: { name: string; location: string };
  // Shows the Date blocks tab, the Block dates button and the panel.
  canManageBlocks: boolean;
};

// Header, tabs and tab content of the Availability & Date Blocks page.
export function AvailabilityWorkspace({ place, canManageBlocks }: AvailabilityWorkspaceProps) {
  const tabs = canManageBlocks ? TABS : TABS.filter((tab) => tab.key !== "blocks");
  const [active, setActive] = useState<Tab>("check");
  // Opened by "Block dates"; the panel itself comes in a later part.
  const [blockPanelOpen, setBlockPanelOpen] = useState(false);
  const baseId = useId();
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

  // Arrow keys move between tabs (WAI-ARIA tabs pattern, automatic activation).
  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = tabs.length - 1;
    const next =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    const key = tabs[next].key;
    setActive(key);
    tabRefs.current[key]?.focus();
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Availability & Date Blocks"
        place={place}
        titleClassName="font-bold text-brand-tropical"
        action={
          canManageBlocks ? (
            <Button
              type="button"
              variant="outline"
              aria-expanded={blockPanelOpen}
              onClick={() => setBlockPanelOpen((open) => !open)}
              className="h-11 gap-2 rounded-lg border-border bg-card px-4 text-sm font-semibold text-brand-tropical hover:bg-office-chip md:h-10"
            >
              <CalendarX2 aria-hidden="true" className="size-4" />
              Block dates
            </Button>
          ) : null
        }
      />

      <div role="tablist" aria-label="Availability views" className="flex flex-wrap gap-2">
        {tabs.map((tab, index) => {
          const selected = tab.key === active;
          return (
            <button
              key={tab.key}
              ref={(node) => {
                tabRefs.current[tab.key] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.key}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.key)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              className={cn(
                "focus-ring inline-flex h-11 items-center rounded-lg px-4 text-sm font-medium whitespace-nowrap transition-colors motion-reduce:transition-none md:h-9",
                selected ? "bg-brand-tropical text-white" : "bg-office-chip text-foreground hover:bg-office-pill",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.key}
          role="tabpanel"
          id={`${baseId}-panel-${tab.key}`}
          aria-labelledby={`${baseId}-tab-${tab.key}`}
          hidden={tab.key !== active}
          tabIndex={0}
          className="focus-ring rounded-xl"
        >
          {/* Tab content is added in the next parts. */}
          <div className="min-h-40 rounded-xl border border-border bg-card" />
        </div>
      ))}
    </div>
  );
}
