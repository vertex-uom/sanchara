import { BedDouble } from "lucide-react";
import type { RoomType, UnitAvailability } from "../types";
import { UnitCard } from "./unit-card";

type RoomTypeGroupProps = { roomType: RoomType; units: UnitAvailability[] };

// "Deluxe Rooms (4 units)" and its unit cards: 2 columns, 4 on desktop.
export function RoomTypeGroup({ roomType, units }: RoomTypeGroupProps) {
  const headingId = `room-type-${roomType.id}`;

  return (
    <section aria-labelledby={headingId}>
      <h3 id={headingId} className="flex items-center gap-2 text-base">
        <BedDouble aria-hidden="true" className="size-5 shrink-0 text-office-icon" strokeWidth={1.5} />
        <span className="font-bold text-foreground">{roomType.name} Rooms</span>
        <span className="text-sm text-office-muted">
          ({units.length} {units.length === 1 ? "unit" : "units"})
        </span>
      </h3>
      <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {units.map((availability) => (
          <li key={availability.unit.id} className="flex">
            <UnitCard availability={availability} roomTypeName={roomType.name} />
          </li>
        ))}
      </ul>
    </section>
  );
}
