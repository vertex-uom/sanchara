import type { RestrictionRule, UnitAvailability } from "./types";

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
