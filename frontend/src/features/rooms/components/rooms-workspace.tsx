"use client";

import { useState } from "react";
import { Plus, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/widget";
import { filterRooms, hasFilters, NO_FILTERS, type RoomFilters } from "../filters";
import { useRoomsAndUnits } from "../hooks/use-rooms-and-units";
import { groupUnitsByType } from "../stats";
import { RoomTypeGroup } from "./room-type-group";
import { RoomsToolbar } from "./rooms-toolbar";
import { StatCards } from "./stat-cards";

const PRIMARY_BUTTON = "h-11 gap-2 rounded-lg bg-brand-tropical px-4 text-sm font-semibold text-white hover:bg-brand-tropical/90 md:h-10";

type RoomsWorkspaceProps = {
  propertyId: string;
  place: { name: string; location: string };
  // Shows Add room type, Add unit, every Edit and the edit panel.
  canManageRooms: boolean;
};

// Header, stat cards, toolbar and (next parts) the room type groups.
export function RoomsWorkspace({ propertyId, place, canManageRooms }: RoomsWorkspaceProps) {
  const { roomTypes, units, stats, loading, error } = useRoomsAndUnits(propertyId);
  const [filters, setFilters] = useState<RoomFilters>(NO_FILTERS);
  // The unit chosen for editing (the edit panel comes in a later part).
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const filtered = filterRooms(roomTypes, units, filters);
  const filtering = hasFilters(filters);
  // While filtering, only room types with matching units; otherwise all of
  // them, so a new room type without units still shows.
  const groups = groupUnitsByType(roomTypes, filtered.units).filter((group) => !filtering || group.units.length > 0);
  const showEmpty = !loading && !error && units.length > 0 && filtered.units.length === 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Rooms & Units"
        place={place}
        titleClassName="font-bold text-brand-tropical"
        action={
          canManageRooms ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" className={PRIMARY_BUTTON}>
                <Plus aria-hidden="true" className="size-4" />
                Add room type
              </Button>
              <Button type="button" className={PRIMARY_BUTTON}>
                <Plus aria-hidden="true" className="size-4" />
                Add unit
              </Button>
            </div>
          ) : null
        }
      />

      <StatCards stats={stats} loading={loading} />

      <RoomsToolbar filters={filters} counts={filtered.counts} onChange={setFilters} />

      {error ? (
        <p role="alert" className="rounded-xl border border-office-danger/40 bg-card px-4 py-3 text-sm font-medium text-office-danger-text">
          {error.message}
        </p>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {loading || !filtering ? "" : `${filtered.units.length} ${filtered.units.length === 1 ? "unit" : "units"} shown`}
      </p>

      {loading ? (
        <div aria-busy="true" className="flex flex-col gap-5">
          <span className="sr-only">Loading room types</span>
          <Skeleton className="h-56 rounded-[16px]" />
          <Skeleton className="h-72 rounded-[16px]" />
        </div>
      ) : showEmpty ? null : (
        groups.map(({ roomType, units: groupUnits }) => (
          <RoomTypeGroup
            key={roomType.id}
            roomType={roomType}
            units={groupUnits}
            selectedUnitId={selectedUnitId}
            onSelectUnit={canManageRooms ? setSelectedUnitId : undefined}
            // Opens the room type editor in a later part.
            onEditRoomType={canManageRooms ? () => undefined : undefined}
          />
        ))
      )}

      {showEmpty ? (
        <div className="flex flex-col items-center gap-3 rounded-[12px] border border-border bg-card px-4 py-12 text-center">
          <SearchX aria-hidden="true" className="size-8 text-office-icon" strokeWidth={1.5} />
          <p className="font-semibold text-foreground">No rooms match your search</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setFilters(NO_FILTERS)}
            className="h-11 rounded-lg bg-card px-4 text-sm font-semibold text-brand-tropical md:h-10"
          >
            Clear filters
          </Button>
        </div>
      ) : null}
    </div>
  );
}
