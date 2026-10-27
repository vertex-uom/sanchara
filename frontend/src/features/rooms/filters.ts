import type { RoomType, RoomUnit } from "./types";

export type StatusFilter = "all" | "active" | "inactive";

export const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

export type RoomFilters = { query: string; status: StatusFilter };

export const NO_FILTERS: RoomFilters = { query: "", status: "all" };

// A unit matches the search when its own name or its room type's name
// contains the text (case-insensitive).
function matchesQuery(unit: RoomUnit, roomTypeName: string, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return unit.name.toLowerCase().includes(needle) || roomTypeName.toLowerCase().includes(needle);
}

function matchesStatus(unit: RoomUnit, status: StatusFilter) {
  return status === "all" || unit.isActive === (status === "active");
}

// Units left after search and status, plus chip counts with the search
// applied (so "Active (n)" says what clicking it would show).
export function filterRooms(roomTypes: RoomType[], units: RoomUnit[], filters: RoomFilters) {
  const typeName = new Map(roomTypes.map((t) => [t.id, t.name]));
  const searched = units.filter((u) => matchesQuery(u, typeName.get(u.roomTypeId) ?? "", filters.query));
  const active = searched.filter((u) => u.isActive).length;

  return {
    units: searched.filter((u) => matchesStatus(u, filters.status)),
    counts: { all: searched.length, active, inactive: searched.length - active } satisfies Record<StatusFilter, number>,
  };
}

export function hasFilters(filters: RoomFilters) {
  return filters.query.trim() !== "" || filters.status !== "all";
}
