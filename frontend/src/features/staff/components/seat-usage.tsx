import { Users } from "lucide-react";
import { formatCount } from "@/lib/format/numbers";
import { UsageMeter } from "@/components/ui/usage-meter";
import { FlatCard } from "@/components/ui/widget";
import type { StaffList } from "../types";

// Seats come from the API; the bar only scales them.
export function SeatUsage({ seats }: { seats: StaffList["seats"] }) {
  return (
    <FlatCard aria-label="Plan usage" className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3.5 sm:py-3.5">
      <p id="staff-seats-label" className="flex items-center gap-3 text-lg font-semibold">
        <Users aria-hidden="true" className="size-7 shrink-0 text-office-icon" />
        Staff accounts: {formatCount(seats.used)} of {formatCount(seats.limit)} used
      </p>
      <UsageMeter labelledBy="staff-seats-label" used={seats.used} limit={seats.limit} className="h-2 w-full max-w-48" />
      <p className="text-sm text-office-muted">Limit set by your plan</p>
    </FlatCard>
  );
}
