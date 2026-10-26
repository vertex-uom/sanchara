import { z } from "zod";
import { MAX_GUESTS_MAX, MAX_GUESTS_MIN } from "./constants";
import type { RoomUnit, UpdateUnitInput } from "./types";

export const UNIT_NAME_MAX = 50;

// Edit unit form. Uniqueness of the name is checked by the API on save.
export const unitFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a unit name.")
    .max(UNIT_NAME_MAX, `Keep the name to ${UNIT_NAME_MAX} characters.`),
  roomTypeId: z.string().min(1, "Choose a room type."),
  maxGuests: z
    .number({ error: `Enter a number from ${MAX_GUESTS_MIN} to ${MAX_GUESTS_MAX}.` })
    .int(`Enter a whole number from ${MAX_GUESTS_MIN} to ${MAX_GUESTS_MAX}.`)
    .min(MAX_GUESTS_MIN, `Enter a number from ${MAX_GUESTS_MIN} to ${MAX_GUESTS_MAX}.`)
    .max(MAX_GUESTS_MAX, `Enter a number from ${MAX_GUESTS_MIN} to ${MAX_GUESTS_MAX}.`),
  status: z.enum(["active", "inactive"]),
});

export type UnitFormValues = z.infer<typeof unitFormSchema>;

export function unitFormDefaults(unit: RoomUnit): UnitFormValues {
  return {
    name: unit.name,
    roomTypeId: unit.roomTypeId,
    maxGuests: unit.maxGuests,
    status: unit.isActive ? "active" : "inactive",
  };
}

export function toUpdateUnitInput(values: UnitFormValues): UpdateUnitInput {
  return { name: values.name, roomTypeId: values.roomTypeId, maxGuests: values.maxGuests, isActive: values.status === "active" };
}
