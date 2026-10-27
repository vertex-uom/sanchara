import type { BlockReason, RestrictionRule, RoomType, UnitAvailability } from "./types";

export const BLOCK_REASON_LABELS: Record<BlockReason, string> = {
  maintenance: "Maintenance",
  closure: "Closure",
  other: "Other",
};

export const BLOCK_REASONS = Object.keys(BLOCK_REASON_LABELS) as BlockReason[];

export type UnitFilter = "all" | "available" | "unavailable";

export const UNIT_FILTERS: { key: UnitFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "available", label: "Available" },
  { key: "unavailable", label: "Unavailable" },
];

export const RESTRICTION_LABELS: Record<RestrictionRule, string> = {
  min_stay: "Minimum stay",
  max_stay: "Maximum stay",
  max_guests: "Maximum guests",
  booking_window: "Booking window",
};

export function countUnits(units: UnitAvailability[]): Record<UnitFilter, number> {
  const available = units.filter((u) => u.status === "available").length;
  return { all: units.length, available, unavailable: units.length - available };
}

export function filterUnits(units: UnitAvailability[], filter: UnitFilter) {
  if (filter === "all") return units;
  return units.filter((u) => (u.status === "available") === (filter === "available"));
}

// Units by room type, in the property's room type order. Groups the filter
// leaves empty are dropped.
export function groupUnits(roomTypes: RoomType[], units: UnitAvailability[]) {
  return roomTypes
    .map((roomType) => ({ roomType, units: units.filter((u) => u.unit.roomTypeId === roomType.id) }))
    .filter((group) => group.units.length > 0);
}

function dateParts(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  const month = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(date);
  return { day: date.getUTCDate(), month, year: date.getUTCFullYear() };
}

// "21 – 24 Oct 2026", "30 Oct – 2 Nov 2026", "30 Dec 2026 – 2 Jan 2027".
export function formatDateRange(from: string, to: string) {
  const a = dateParts(from);
  const b = dateParts(to);
  if (a.year !== b.year) return `${a.day} ${a.month} ${a.year} – ${b.day} ${b.month} ${b.year}`;
  if (a.month !== b.month) return `${a.day} ${a.month} – ${b.day} ${b.month} ${b.year}`;
  return `${a.day} – ${b.day} ${b.month} ${b.year}`;
}

const day = (iso: string) => Number(iso.slice(8, 10));
const month = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

// "21 to 24 Oct", "30 Oct to 2 Nov", "30 Dec 2026 to 2 Jan 2027".
export function formatStayRange(from: string, to: string) {
  if (from.slice(0, 4) !== to.slice(0, 4)) {
    return `${day(from)} ${month(from)} ${from.slice(0, 4)} to ${day(to)} ${month(to)} ${to.slice(0, 4)}`;
  }
  if (from.slice(0, 7) !== to.slice(0, 7)) return `${day(from)} ${month(from)} to ${day(to)} ${month(to)}`;
  return `${day(from)} to ${day(to)} ${month(to)}`;
}
