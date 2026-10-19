import { formatPercent } from "@/lib/format/numbers";
import { FlatCard } from "@/components/ui/widget";
import type { RoomTypeOccupancy as RoomTypeRow } from "../types";

// Bars are decorative; the name and percentage carry the value.
export function RoomTypeOccupancy({ rows }: { rows: RoomTypeRow[] }) {
  return (
    <FlatCard aria-labelledby="room-occupancy-title">
      <h2 id="room-occupancy-title" className="mb-5 text-base font-semibold">
        Occupancy by room type
      </h2>
      <ul className="space-y-6">
        {rows.map((row) => (
          <li key={row.id}>
            <p className="text-sm text-office-label">{row.name}</p>
            <div className="mt-2 flex items-center gap-4">
              <div aria-hidden="true" className="h-2.5 flex-1 overflow-hidden rounded-full bg-office-meter-track">
                <div className="h-full rounded-full bg-office-chart-bright" style={{ width: `${Math.min(row.ratio, 1) * 100}%` }} />
              </div>
              <span className="w-12 text-right text-sm font-semibold">{formatPercent(row.ratio, 0)}</span>
            </div>
          </li>
        ))}
      </ul>
    </FlatCard>
  );
}
