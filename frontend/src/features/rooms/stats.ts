import type { RoomStats, RoomType, RoomUnit } from "./types";

// Header counts: room types, units, active units.
export function computeStats(roomTypes: RoomType[], units: RoomUnit[]): RoomStats {
  return {
    roomTypes: roomTypes.length,
    units: units.length,
    activeUnits: units.filter((unit) => unit.isActive).length,
  };
}

// "Room 2" before "Room 10".
export function compareUnitNames(a: RoomUnit, b: RoomUnit) {
  return a.name.localeCompare(b.name, "en", { numeric: true, sensitivity: "base" });
}

// Units under each room type, in room type order, names sorted naturally.
export function groupUnitsByType(roomTypes: RoomType[], units: RoomUnit[]) {
  return roomTypes.map((roomType) => ({
    roomType,
    units: units.filter((unit) => unit.roomTypeId === roomType.id).sort(compareUnitNames),
  }));
}
