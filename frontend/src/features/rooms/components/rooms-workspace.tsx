"use client";

import { useCallback, useRef, useState } from "react";
import { BedDouble, Plus, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { ToastProvider } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/widget";
import { cn } from "@/lib/utils";
import { filterRooms, hasFilters, NO_FILTERS, type RoomFilters } from "../filters";
import { useRoomsAndUnits } from "../hooks/use-rooms-and-units";
import { groupUnitsByType } from "../stats";
import { RoomTypeGroup } from "./room-type-group";
import { RoomTypePanel } from "./room-type-panel";
import { RoomsToolbar } from "./rooms-toolbar";
import { StatCards } from "./stat-cards";
import { UnitPanel } from "./unit-panel";

const PRIMARY_BUTTON = "h-11 gap-2 rounded-lg bg-brand-tropical px-4 text-sm font-semibold text-white hover:bg-brand-tropical/90 md:h-10";

// The one panel that can be open on the right.
type Panel =
  | { kind: "edit-unit"; unitId: string }
  | { kind: "add-unit" }
  | { kind: "edit-type"; roomTypeId: string }
  | { kind: "add-type" };

function samePanel(a: Panel | null, b: Panel | null) {
  return JSON.stringify(a) === JSON.stringify(b);
}

type RoomsWorkspaceProps = {
  propertyId: string;
  place: { name: string; location: string };
  // Shows Add room type, Add unit, every Edit and the panels.
  canManageRooms: boolean;
};

// Header, stat cards, toolbar and room type groups, with one panel (unit or
// room type, add or edit) docked on the right while open.
export function RoomsWorkspace({ propertyId, place, canManageRooms }: RoomsWorkspaceProps) {
  const rooms = useRoomsAndUnits(propertyId);
  const { roomTypes, units, stats, loading, error, saving, refresh } = rooms;
  const [filters, setFilters] = useState<RoomFilters>(NO_FILTERS);

  const [panel, setPanel] = useState<Panel | null>(null);
  // Unsaved edits in the open panel, and where to go once the user decides.
  const [panelDirty, setPanelDirty] = useState(false);
  const [pending, setPending] = useState<{ next: Panel | null } | null>(null);
  const onDirtyChange = useCallback((dirty: boolean) => setPanelDirty(dirty), []);
  // The control that opened the panel, to get focus back when it closes.
  const opener = useRef<HTMLElement | null>(null);

  function goTo(next: Panel | null) {
    setPanelDirty(false);
    setPanel(next);
    if (next === null) {
      const target = opener.current;
      requestAnimationFrame(() => {
        if (target?.isConnected) target.focus();
      });
    }
  }

  // Opens a panel (or closes with null), asking before unsaved changes are lost.
  function requestPanel(next: Panel | null) {
    if (samePanel(next, panel)) return;
    if (next !== null && document.activeElement instanceof HTMLElement) opener.current = document.activeElement;
    if (panelDirty) setPending({ next });
    else goTo(next);
  }

  const openPanel = canManageRooms ? panel : null;
  const editUnit = openPanel?.kind === "edit-unit" ? units.find((u) => u.id === openPanel.unitId) : undefined;
  const editType = openPanel?.kind === "edit-type" ? roomTypes.find((t) => t.id === openPanel.roomTypeId) : undefined;

  const filtered = filterRooms(roomTypes, units, filters);
  const filtering = hasFilters(filters);
  // While filtering, only room types with matching units; otherwise all of
  // them, so a new room type without units still shows.
  const groups = groupUnitsByType(roomTypes, filtered.units).filter((group) => !filtering || group.units.length > 0);
  const ready = !loading && !error;
  const noRoomTypes = ready && roomTypes.length === 0;
  const showEmpty = ready && units.length > 0 && filtered.units.length === 0;

  const addRoomTypeButton = (
    <Button type="button" className={PRIMARY_BUTTON} onClick={() => requestPanel({ kind: "add-type" })}>
      <Plus aria-hidden="true" className="size-4" />
      Add room type
    </Button>
  );

  let panelNode = null;
  if (openPanel?.kind === "edit-unit" && editUnit) {
    panelNode = (
      <UnitPanel
        unit={editUnit}
        defaultRoomTypeId={editUnit.roomTypeId}
        units={units}
        roomTypes={roomTypes}
        saving={saving}
        onRequestClose={() => requestPanel(null)}
        onDirtyChange={onDirtyChange}
        onSave={(input) => rooms.updateUnit(editUnit.id, input)}
        onCreated={() => undefined}
        onRefresh={() => void refresh()}
      />
    );
  } else if (openPanel?.kind === "add-unit" && roomTypes.length > 0) {
    panelNode = (
      <UnitPanel
        defaultRoomTypeId={roomTypes[0].id}
        units={units}
        roomTypes={roomTypes}
        saving={saving}
        onRequestClose={() => requestPanel(null)}
        onDirtyChange={onDirtyChange}
        onSave={(input) => rooms.createUnit(input)}
        onCreated={(unit) => goTo({ kind: "edit-unit", unitId: unit.id })}
        onRefresh={() => void refresh()}
      />
    );
  } else if (openPanel?.kind === "edit-type" && editType) {
    panelNode = (
      <RoomTypePanel
        roomType={editType}
        roomTypes={roomTypes}
        saving={saving}
        onRequestClose={() => requestPanel(null)}
        onDirtyChange={onDirtyChange}
        onSave={(input) => rooms.updateRoomType(editType.id, input)}
        onCreated={() => undefined}
        onRefresh={() => void refresh()}
      />
    );
  } else if (openPanel?.kind === "add-type") {
    panelNode = (
      <RoomTypePanel
        roomTypes={roomTypes}
        saving={saving}
        onRequestClose={() => requestPanel(null)}
        onDirtyChange={onDirtyChange}
        onSave={(input) => rooms.createRoomType(input)}
        onCreated={(roomType) => goTo({ kind: "edit-type", roomTypeId: roomType.id })}
        onRefresh={() => void refresh()}
      />
    );
  }

  return (
    // Toasts sit above the docked panel's pinned Cancel / Save row.
    <ToastProvider className={panelNode ? "xl:bottom-28" : undefined}>
      <div className={cn("grid items-start gap-5", panelNode && "xl:grid-cols-[minmax(0,1fr)_21.25rem]")}>
        {/* Container queries: cards and grids follow this column's width, which shrinks while a panel is open. */}
        <div className="@container flex min-w-0 flex-col gap-5">
          <PageHeader
            title="Rooms & Units"
            place={place}
            titleClassName="font-bold text-brand-tropical"
            action={
              canManageRooms ? (
                <div className="flex flex-wrap gap-2">
                  {addRoomTypeButton}
                  <Button
                    type="button"
                    className={PRIMARY_BUTTON}
                    disabled={roomTypes.length === 0}
                    onClick={() => requestPanel({ kind: "add-unit" })}
                  >
                    <Plus aria-hidden="true" className="size-4" />
                    Add unit
                  </Button>
                </div>
              ) : null
            }
          />

          <StatCards stats={stats} loading={loading} />

          {noRoomTypes ? null : <RoomsToolbar filters={filters} counts={filtered.counts} onChange={setFilters} />}

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
          ) : noRoomTypes ? (
            <div className="flex flex-col items-center gap-3 rounded-[16px] border border-border bg-card px-4 py-14 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-xl bg-brand-aqua text-brand-tropical">
                <BedDouble aria-hidden="true" className="size-6" strokeWidth={1.5} />
              </span>
              <p className="font-semibold text-foreground">
                {canManageRooms ? "Add your first room type to get started" : "No room types yet"}
              </p>
              {canManageRooms ? addRoomTypeButton : null}
            </div>
          ) : showEmpty ? (
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
          ) : (
            groups.map(({ roomType, units: groupUnits }) => (
              <RoomTypeGroup
                key={roomType.id}
                roomType={roomType}
                units={groupUnits}
                selectedUnitId={openPanel?.kind === "edit-unit" ? openPanel.unitId : null}
                onSelectUnit={canManageRooms ? (unitId) => requestPanel({ kind: "edit-unit", unitId }) : undefined}
                onEditRoomType={canManageRooms ? (roomTypeId) => requestPanel({ kind: "edit-type", roomTypeId }) : undefined}
              />
            ))
          )}
        </div>

        {panelNode}

        <ConfirmDialog
          open={pending !== null}
          onOpenChange={(open) => {
            if (!open) setPending(null);
          }}
          title="Discard changes?"
          confirmLabel="Discard"
          cancelLabel="Keep editing"
          onConfirm={() => {
            if (pending) goTo(pending.next);
            setPending(null);
          }}
        >
          <p>Your changes haven&apos;t been saved.</p>
        </ConfirmDialog>
      </div>
    </ToastProvider>
  );
}
