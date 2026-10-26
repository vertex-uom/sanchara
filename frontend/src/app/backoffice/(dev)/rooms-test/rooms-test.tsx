"use client";

// THROWAWAY: checks Part 1 of the Rooms & Units page. Delete with the page.
import { groupUnitsByType, useRoomsAndUnits } from "@/features/rooms";

export function RoomsTest() {
  const { roomTypes, units, stats, loading, error } = useRoomsAndUnits("palm-breeze");

  if (error) return <p>Error: {error.message}</p>;
  if (loading) return <p>Loading…</p>;

  return (
    <div className="space-y-6 p-6 font-mono text-sm">
      <section>
        <h1 className="font-semibold">Stats</h1>
        <p data-testid="stats">
          {stats.roomTypes} / {stats.units} / {stats.activeUnits}
        </p>
        <p className="text-office-muted">room types / units / active units</p>
      </section>
      <section className="space-y-3">
        <h2 className="font-semibold">Units by type</h2>
        {groupUnitsByType(roomTypes, units).map(({ roomType, units: typeUnits }) => (
          <div key={roomType.id}>
            <p>
              {roomType.name} ({typeUnits.length}): {roomType.description}
            </p>
            <ul className="ml-4">
              {typeUnits.map((unit) => (
                <li key={unit.id}>
                  {unit.name}: max {unit.maxGuests}, {unit.isActive ? "active" : "inactive"}
                  {unit.hasFutureReservations ? ", has future reservations" : ""}, {unit.photoUrl}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
