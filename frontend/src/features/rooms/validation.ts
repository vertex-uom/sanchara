import { z } from "zod";
import {
  INACTIVE_UNIT_WITH_RESERVATIONS,
  MAX_GUESTS_MAX,
  MAX_GUESTS_MIN,
  NEW_UNIT_MAX_GUESTS,
  ROOM_TYPE_DESCRIPTION_MAX,
} from "./constants";
import type { RoomType, RoomTypeInput, RoomUnit, UpdateUnitInput } from "./types";

export const UNIT_NAME_MAX = 50;

export const UNIT_NAME_TAKEN = "Another unit in this property already has this name.";

const guestsMessage = `Enter a whole number from ${MAX_GUESTS_MIN} to ${MAX_GUESTS_MAX}.`;

// Names compare trimmed and case-insensitively ("room 1" clashes with "Room 1").
export function normaliseUnitName(name: string) {
  return name.trim().toLowerCase();
}

// Edit unit form. `otherNames` are the property's other unit names, so the
// unit being edited may keep its own name. The API checks again on save.
export function unitFormSchema(otherNames: string[]) {
  const taken = new Set(otherNames.map(normaliseUnitName));
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, "Enter a unit name.")
      .max(UNIT_NAME_MAX, `Keep the name to ${UNIT_NAME_MAX} characters.`)
      .refine((name) => !taken.has(normaliseUnitName(name)), UNIT_NAME_TAKEN),
    roomTypeId: z.string().min(1, "Choose a room type."),
    maxGuests: z
      .number({ error: guestsMessage })
      .int(guestsMessage)
      .min(MAX_GUESTS_MIN, guestsMessage)
      .max(MAX_GUESTS_MAX, guestsMessage),
    status: z.enum(["active", "inactive"]),
  });
}

export type UnitFormValues = z.infer<ReturnType<typeof unitFormSchema>>;

export function unitFormDefaults(unit: RoomUnit): UnitFormValues {
  return {
    name: unit.name,
    roomTypeId: unit.roomTypeId,
    maxGuests: unit.maxGuests,
    status: unit.isActive ? "active" : "inactive",
  };
}

// A new unit: no name yet, the given room type, 2 guests, active.
export function newUnitDefaults(roomTypeId: string): UnitFormValues {
  return { name: "", roomTypeId, maxGuests: NEW_UNIT_MAX_GUESTS, status: "active" };
}

export function toUpdateUnitInput(values: UnitFormValues): UpdateUnitInput {
  return { name: values.name, roomTypeId: values.roomTypeId, maxGuests: values.maxGuests, isActive: values.status === "active" };
}

export const ROOM_TYPE_NAME_TAKEN = "This property already has a room type with this name.";

// Add / edit room type form. `otherNames` are the property's other room type
// names; the API checks again on save.
export function roomTypeFormSchema(otherNames: string[]) {
  const taken = new Set(otherNames.map(normaliseUnitName));
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, "Enter a room type name.")
      .max(UNIT_NAME_MAX, `Keep the name to ${UNIT_NAME_MAX} characters.`)
      .refine((name) => !taken.has(normaliseUnitName(name)), ROOM_TYPE_NAME_TAKEN),
    description: z
      .string()
      .trim()
      .max(ROOM_TYPE_DESCRIPTION_MAX, `Keep the description to ${ROOM_TYPE_DESCRIPTION_MAX} characters.`),
  });
}

export type RoomTypeFormValues = z.infer<ReturnType<typeof roomTypeFormSchema>>;

export function roomTypeFormDefaults(roomType?: RoomType): RoomTypeFormValues {
  return { name: roomType?.name ?? "", description: roomType?.description ?? "" };
}

export function toRoomTypeInput(values: RoomTypeFormValues): RoomTypeInput {
  return { name: values.name, description: values.description || undefined };
}

// What the form says about deactivating a unit that has future reservations.
export function deactivationRule(unit: RoomUnit, status: UnitFormValues["status"]) {
  const deactivating = unit.isActive && status === "inactive" && unit.hasFutureReservations;
  return {
    warn: deactivating,
    blocksSave: deactivating && INACTIVE_UNIT_WITH_RESERVATIONS === "prevent",
  };
}
