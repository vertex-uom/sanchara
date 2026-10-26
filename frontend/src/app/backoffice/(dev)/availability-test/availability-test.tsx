"use client";

// THROWAWAY: checks Part 1 of the availability page. Delete with the page.
import { useEffect } from "react";
import { useAvailability } from "@/features/availability";

const PARAMS = { arrival: "2026-10-21", departure: "2026-10-24", guests: 2, roomTypeId: "all" };

export function AvailabilityTest() {
  const { result, searching, searchError, search, conflicts, checkConflicts } = useAvailability("palm-breeze");

  useEffect(() => {
    void search(PARAMS);
    void checkConflicts({ unitIds: ["room-2", "room-6"], startDate: "2026-10-28", endDate: "2026-10-30", reason: "maintenance" });
  }, [search, checkConflicts]);

  if (searchError) return <p>Error: {searchError.message}</p>;
  if (searching || !result) return <p>Loading…</p>;

  return (
    <div className="space-y-6 p-6 font-mono text-sm">
      <section>
        <h1 className="font-semibold">Search 21–24 Oct 2026, 2 guests, All</h1>
        <ul>
          {result.units.map((u) => (
            <li key={u.unit.id} data-status={u.status}>
              {u.unit.name}: {u.status}
              {u.heldUntil && ` (held until ${u.heldUntil}, ${u.holdKind})`}
              {u.bookedFrom && ` (${u.bookedFrom} → ${u.bookedTo})`}
              {u.blockReason && ` (${u.blockReason})`}
              {u.requestedGuests !== undefined && ` (max ${u.unit.maxGuests}, requested ${u.requestedGuests})`}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-semibold">Block conflicts: Rooms 2 + 6, 28–30 Oct</h2>
        <ul>
          {conflicts.map((c) => (
            <li key={c.id}>
              {c.kind}: {c.guestName} · {c.unitName} · {c.from} → {c.to} · {c.status}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
