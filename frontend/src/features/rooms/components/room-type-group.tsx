"use client";

import { useState } from "react";
import { BedDouble, ChevronDown, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RoomType, RoomUnit } from "../types";
import { UnitCard } from "./unit-card";

type RoomTypeGroupProps = {
  roomType: RoomType;
  // Units shown, after search and status filter.
  units: RoomUnit[];
  selectedUnitId: string | null;
  // Both left out when the viewer can't manage rooms.
  onSelectUnit?: (unitId: string) => void;
  onEditRoomType?: (roomTypeId: string) => void;
};

// One room type: header with Edit and a collapse toggle, then its unit cards
// (1 column on phones, 2 on tablets, 3 on desktop). Expanded by default.
export function RoomTypeGroup({ roomType, units, selectedUnitId, onSelectUnit, onEditRoomType }: RoomTypeGroupProps) {
  const [expanded, setExpanded] = useState(true);
  const headingId = `room-type-${roomType.id}`;
  const panelId = `room-type-${roomType.id}-units`;

  return (
    <section aria-labelledby={headingId} className="rounded-[16px] border border-border bg-card p-4 sm:p-5">
      {/* Icon | name and pill | actions; the description runs under the actions so it isn't squeezed on phones. */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3">
        <span className="row-span-2 inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-aqua text-brand-tropical">
          <BedDouble aria-hidden="true" className="size-5" strokeWidth={1.5} />
        </span>
        <div className="flex min-h-10 flex-wrap items-center gap-2">
          <h2 id={headingId} className="text-lg font-bold text-foreground">
            {roomType.name}
          </h2>
          <span className="rounded-md bg-office-chip px-2 py-0.5 text-xs font-medium text-office-label">
            {units.length} {units.length === 1 ? "unit" : "units"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onEditRoomType ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => onEditRoomType(roomType.id)}
              className="h-11 gap-1.5 rounded-lg bg-card px-3 text-sm font-semibold text-brand-tropical md:h-9"
            >
              <Pencil aria-hidden="true" className="size-4" strokeWidth={1.75} />
              Edit
              <span className="sr-only"> {roomType.name} room type</span>
            </Button>
          ) : null}
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={panelId}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${roomType.name}`}
            onClick={() => setExpanded((open) => !open)}
            className="focus-ring inline-flex size-11 items-center justify-center rounded-lg text-office-icon hover:bg-office-chip md:size-9"
          >
            <ChevronDown
              aria-hidden="true"
              className={cn("size-5 transition-transform motion-reduce:transition-none", expanded && "rotate-180")}
            />
          </button>
        </div>
        {roomType.description ? (
          <p className="col-span-2 col-start-2 text-sm text-office-muted">{roomType.description}</p>
        ) : null}
      </div>

      {units.length === 0 ? (
        <p id={panelId} hidden={!expanded} className="mt-4 rounded-lg bg-office-chip px-4 py-5 text-center text-sm text-office-muted">
          No units in this room type yet.
        </p>
      ) : (
        <ul id={panelId} hidden={!expanded} className="mt-4 grid gap-3 @lg:grid-cols-2 @3xl:grid-cols-3">
          {units.map((unit) => (
            <li key={unit.id} className="flex">
              <UnitCard unit={unit} selected={unit.id === selectedUnitId} onSelect={onSelectUnit} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
