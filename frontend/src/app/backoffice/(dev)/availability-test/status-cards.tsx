// THROWAWAY: one UnitCard per status, with the screenshot's values. Delete with the page.
import { UnitCard, type UnitAvailability } from "@/features/availability";

const deluxe = (id: string, name: string) => ({ id, name, roomTypeId: "deluxe", maxGuests: 3 });
const standard = (id: string, name: string) => ({ id, name, roomTypeId: "standard", maxGuests: 2 });

const SAMPLES: { roomTypeName: string; availability: UnitAvailability }[] = [
  { roomTypeName: "Deluxe", availability: { unit: deluxe("room-1", "Room 1"), status: "available" } },
  {
    roomTypeName: "Deluxe",
    availability: { unit: deluxe("room-2", "Room 2"), status: "held", heldUntil: "2026-10-21T14:30:00+05:30", holdKind: "enquiry" },
  },
  {
    roomTypeName: "Deluxe",
    availability: { unit: deluxe("room-3", "Room 3"), status: "booked", bookedFrom: "2026-10-21", bookedTo: "2026-10-24" },
  },
  { roomTypeName: "Deluxe", availability: { unit: deluxe("room-4", "Room 4"), status: "blocked", blockReason: "maintenance" } },
  {
    roomTypeName: "Standard",
    availability: { unit: standard("room-7", "Room 7"), status: "capacity_too_small", requestedGuests: 3 },
  },
];

export function StatusCards() {
  return (
    <section className="space-y-3 font-sans">
      <h2 className="font-semibold">Unit cards, one per status</h2>
      <div className="grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {SAMPLES.map((sample) => (
          <UnitCard key={sample.availability.unit.id} {...sample} />
        ))}
      </div>
    </section>
  );
}
