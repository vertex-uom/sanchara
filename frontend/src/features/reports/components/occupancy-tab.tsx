import { Info } from "lucide-react";
import { EmptyState } from "@/components/ui/widget";
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
  return (
    <>
      <OccupancyFilters path={path} filters={filters} roomTypes={data.roomTypes} />
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
