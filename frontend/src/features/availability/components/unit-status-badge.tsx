import { BACKOFFICE_TIME_ZONE } from "@/lib/format/dates";
import { cn } from "@/lib/utils";
import { BLOCK_REASON_LABELS } from "../results";
import { STATUS_TOKENS } from "../status-tokens";
import type { UnitAvailability } from "../types";

// "2:30 PM" in Colombo time.
function formatClock(iso: string) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: BACKOFFICE_TIME_ZONE }).format(
    new Date(iso),
  );
}

function parts(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  const month = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(date);
  return { day: date.getUTCDate(), month, year: date.getUTCFullYear() };
}

// "21 – 24 Oct 2026", "30 Oct – 2 Nov 2026", "30 Dec 2026 – 2 Jan 2027".
function formatDateRange(from: string, to: string) {
  const a = parts(from);
  const b = parts(to);
  if (a.year !== b.year) return `${a.day} ${a.month} ${a.year} – ${b.day} ${b.month} ${b.year}`;
  if (a.month !== b.month) return `${a.day} ${a.month} – ${b.day} ${b.month} ${b.year}`;
  return `${a.day} – ${b.day} ${b.month} ${b.year}`;
}

// The small second line under the status, if the status has one.
function statusDetail(availability: UnitAvailability) {
  const { status, unit } = availability;
  if (status === "held" && availability.heldUntil) return `Held until ${formatClock(availability.heldUntil)}`;
  if (status === "booked" && availability.bookedFrom && availability.bookedTo) {
    return formatDateRange(availability.bookedFrom, availability.bookedTo);
  }
  if (status === "blocked" && availability.blockReason) return BLOCK_REASON_LABELS[availability.blockReason];
  if (status === "capacity_too_small") {
    const max = `Max ${unit.maxGuests} ${unit.maxGuests === 1 ? "guest" : "guests"}`;
    return availability.requestedGuests === undefined ? max : `${max} (requested ${availability.requestedGuests})`;
  }
  return null;
}

// Status chip: icon + label, plus a detail line for held, booked, blocked
// and capacity. Colour is never the only signal.
export function UnitStatusBadge({ availability, className }: { availability: UnitAvailability; className?: string }) {
  const token = STATUS_TOKENS[availability.status];
  const Icon = token.icon;
  const detail = statusDetail(availability);

  return (
    <div className={cn("rounded-md px-2 py-1.5", token.chip, className)}>
      <p className={cn("flex items-center gap-1.5 text-xs font-medium", token.text)}>
        <Icon aria-hidden="true" className={cn("shrink-0", token.filledIcon ? "size-2" : "size-3.5", token.iconColor)} />
        {token.label}
      </p>
      {detail ? <p className="mt-0.5 text-[0.6875rem] leading-tight text-office-muted">{detail}</p> : null}
    </div>
  );
}
