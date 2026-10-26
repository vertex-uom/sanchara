// MOCK ONLY, logic will live in the NestJS back end.
// In-memory data for Palm Breeze Guest House (Galle, Sri Lanka). State resets
// on reload. Validation here only exists so the UI can be built against
// realistic responses; the API is the source of truth.
import { apiError } from "@/lib/api-client/errors";
import { INACTIVE_UNIT_WITH_RESERVATIONS, MAX_GUESTS_MAX, MAX_GUESTS_MIN, ROOM_TYPE_DESCRIPTION_MAX } from "../constants";
import type { CreateUnitInput, RoomType, RoomTypeInput, RoomUnit, UpdateUnitInput } from "../types";
import type { RoomsApi } from "./rooms";

const PHOTOS = "/images/rooms";

let roomTypes: RoomType[] = [
  { id: "deluxe", name: "Deluxe", description: "Spacious rooms with a comfortable setup" },
  { id: "standard", name: "Standard", description: "Comfortable and budget-friendly rooms" },
];

let units: RoomUnit[] = [
  { id: "room-1", name: "Room 1", roomTypeId: "deluxe", maxGuests: 3, isActive: true, photoUrl: `${PHOTOS}/deluxe-1.jpg`, hasFutureReservations: false },
  { id: "room-2", name: "Room 2", roomTypeId: "deluxe", maxGuests: 3, isActive: true, photoUrl: `${PHOTOS}/deluxe-2.jpg`, hasFutureReservations: true },
  { id: "room-3", name: "Room 3", roomTypeId: "deluxe", maxGuests: 3, isActive: true, photoUrl: `${PHOTOS}/deluxe-3.jpg`, hasFutureReservations: false },
  { id: "room-4", name: "Room 4", roomTypeId: "standard", maxGuests: 2, isActive: true, photoUrl: `${PHOTOS}/standard-1.jpg`, hasFutureReservations: false },
  { id: "room-5", name: "Room 5", roomTypeId: "standard", maxGuests: 2, isActive: true, photoUrl: `${PHOTOS}/standard-2.jpg`, hasFutureReservations: false },
  { id: "room-6", name: "Room 6", roomTypeId: "standard", maxGuests: 2, isActive: true, photoUrl: `${PHOTOS}/standard-3.jpg`, hasFutureReservations: false },
  { id: "room-7", name: "Room 7", roomTypeId: "standard", maxGuests: 2, isActive: true, photoUrl: `${PHOTOS}/standard-1.jpg`, hasFutureReservations: false },
  { id: "room-8", name: "Room 8", roomTypeId: "standard", maxGuests: 2, isActive: false, photoUrl: `${PHOTOS}/standard-2.jpg`, hasFutureReservations: false },
];

let nextId = 100;

// Renaming a unit to this name fails once with "name just taken".
const RACE_NAME = "Room 9";
let raceSimulated = false;

function delay() {
  return new Promise<void>((resolve) => setTimeout(resolve, 300 + Math.random() * 300));
}

// Names compare trimmed and case-insensitively ("room 1" clashes with "Room 1").
function sameName(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function validateUnit(input: UpdateUnitInput, unitId?: string) {
  const fieldErrors: Record<string, string> = {};
  const name = input.name.trim();
  if (!name) fieldErrors.name = "Enter a unit name.";
  else if (name.length > 50) fieldErrors.name = "Keep the name to 50 characters.";
  else if (units.some((u) => u.id !== unitId && sameName(u.name, name))) {
    fieldErrors.name = "Another unit in this property already has this name.";
  }
  if (!roomTypes.some((t) => t.id === input.roomTypeId)) fieldErrors.roomTypeId = "Choose a room type.";
  if (!Number.isInteger(input.maxGuests) || input.maxGuests < MAX_GUESTS_MIN || input.maxGuests > MAX_GUESTS_MAX) {
    fieldErrors.maxGuests = `Enter a number from ${MAX_GUESTS_MIN} to ${MAX_GUESTS_MAX}.`;
  }
  if (Object.keys(fieldErrors).length > 0) throw apiError(422, "validation_failed", "Check the unit details.", fieldErrors);
}

function validateRoomType(input: RoomTypeInput, roomTypeId?: string) {
  const fieldErrors: Record<string, string> = {};
  const name = input.name.trim();
  if (!name) fieldErrors.name = "Enter a room type name.";
  else if (name.length > 50) fieldErrors.name = "Keep the name to 50 characters.";
  else if (roomTypes.some((t) => t.id !== roomTypeId && sameName(t.name, name))) {
    fieldErrors.name = "This property already has a room type with this name.";
  }
  if ((input.description ?? "").length > ROOM_TYPE_DESCRIPTION_MAX) {
    fieldErrors.description = `Keep the description to ${ROOM_TYPE_DESCRIPTION_MAX} characters.`;
  }
  if (Object.keys(fieldErrors).length > 0) throw apiError(422, "validation_failed", "Check the room type details.", fieldErrors);
}

function cleanUnit(input: UpdateUnitInput): UpdateUnitInput {
  return { ...input, name: input.name.trim() };
}

function cleanRoomType(input: RoomTypeInput): RoomTypeInput {
  return { name: input.name.trim(), description: input.description?.trim() || undefined };
}

export const mockRoomsApi: RoomsApi = {
  async listRoomTypes() {
    await delay();
    return roomTypes.map((t) => ({ ...t }));
  },

  async listUnits() {
    await delay();
    return units.map((u) => ({ ...u }));
  },

  async createUnit(_propertyId, input: CreateUnitInput) {
    await delay();
    validateUnit(input);
    const unit: RoomUnit = { id: `unit-${nextId++}`, ...cleanUnit(input), hasFutureReservations: false };
    units = [...units, unit];
    return { ...unit };
  },

  async updateUnit(_propertyId, unitId, input) {
    await delay();
    const current = units.find((u) => u.id === unitId);
    if (!current) throw apiError(404, "unit_not_found", "This unit no longer exists.");
    // Simulated race, once per page load: someone else creates a unit with
    // this name between the form's check and the save.
    if (!raceSimulated && sameName(input.name, RACE_NAME) && !units.some((u) => sameName(u.name, RACE_NAME))) {
      raceSimulated = true;
      units = [
        ...units,
        { id: `unit-${nextId++}`, name: RACE_NAME, roomTypeId: "standard", maxGuests: 2, isActive: true, hasFutureReservations: false },
      ];
    }
    validateUnit(input, unitId);
    if (current.isActive && !input.isActive && current.hasFutureReservations && INACTIVE_UNIT_WITH_RESERVATIONS === "prevent") {
      throw apiError(
        409,
        "unit_has_reservations",
        `${current.name} has upcoming reservations, so it can't be made inactive. Move or cancel them first.`,
        { isActive: "This unit has upcoming reservations." },
      );
    }
    const updated: RoomUnit = { ...current, ...cleanUnit(input) };
    units = units.map((u) => (u.id === unitId ? updated : u));
    return { ...updated };
  },

  async createRoomType(_propertyId, input) {
    await delay();
    validateRoomType(input);
    const roomType: RoomType = { id: `type-${nextId++}`, ...cleanRoomType(input) };
    roomTypes = [...roomTypes, roomType];
    return { ...roomType };
  },

  async updateRoomType(_propertyId, roomTypeId, input) {
    await delay();
    const current = roomTypes.find((t) => t.id === roomTypeId);
    if (!current) throw apiError(404, "room_type_not_found", "This room type no longer exists.");
    validateRoomType(input, roomTypeId);
    const updated: RoomType = { ...current, ...cleanRoomType(input) };
    roomTypes = roomTypes.map((t) => (t.id === roomTypeId ? updated : t));
    return { ...updated };
  },
};
