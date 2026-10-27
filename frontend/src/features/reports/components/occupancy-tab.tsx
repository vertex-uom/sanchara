import { Info } from "lucide-react";
import { formatDate, formatDateOnly } from "@/lib/format/dates";
import { EmptyState } from "@/components/ui/widget";
import { ALL_ROOM_TYPES } from "../config";
import type { ReportFilters } from "../report-filters";
import type { ReportsData } from "../types";
import { OccupancyChart } from "./occupancy-chart";
import { OccupancyFilters } from "./occupancy-filters";
import { ReportKpis } from "./report-kpis";
import { RoomTypeOccupancy } from "./room-type-occupancy";

type OccupancyTabProps = { path: string; filters: ReportFilters; data: ReportsData };

// Chart and room-type panel sit side by side from xl and stack below.
export function OccupancyTab({ path, filters, data }: OccupancyTabProps) {
  const { occupancy } = data;
  const roomType =
    filters.roomType === ALL_ROOM_TYPES
      ? "All room types"
      : (data.roomTypes.find((option) => option.id === filters.roomType)?.name ?? "All room types");
  return (
    <>
      <OccupancyFilters path={path} filters={filters} roomTypes={data.roomTypes} />
      {/* The PDF has no filters on it, so it says what it covers. */}
      <p className="hidden text-sm text-office-label print:block">
        <span className="font-semibold text-foreground">Occupancy report</span> · {formatDateOnly(filters.from)} –{" "}
        {formatDateOnly(filters.to)} · {roomType} · Generated {formatDate(new Date())}
      </p>
      {occupancy ? (
        <>
          <ReportKpis kpis={occupancy.kpis} />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,2.5fr)_minmax(19.5rem,1fr)]">
            <OccupancyChart days={occupancy.byDay} />
            <RoomTypeOccupancy rows={occupancy.byRoomType} />
          </div>
          <p className="flex items-center gap-2 text-sm text-office-muted">
            <Info aria-hidden="true" className="size-4 shrink-0 text-office-icon" />
            Figures are for the selected period.
          </p>
        </>
      ) : (
        <EmptyState>No occupancy data for the selected period.</EmptyState>
      )}
    </>
  );
}
