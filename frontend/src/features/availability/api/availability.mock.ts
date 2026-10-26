// MOCK ONLY, logic will live in the NestJS back end.
// In-memory data for Palm Breeze Guest House (Galle, Sri Lanka). State resets
// on reload. Status rules here only exist so the UI can be built against
// realistic responses; the API is the source of truth.
import { apiError } from "@/lib/api-client/errors";
import { BLOCK_CONFLICT_BEHAVIOUR, BLOCK_END_DATE_INCLUSIVE, STATUS_PRECEDENCE } from "../constants";
import type {
  AvailabilityResult,
  AvailabilitySearchParams,
  BlockConflict,
  CreateBlockInput,
  DateBlock,
  HoldKind,
  RoomType,
  Unit,
  UnitAvailability,
  UnitStatus,
} from "../types";
import type { AvailabilityApi } from "./availability";

type MockReservation = { id: string; unitId: string; guestName: string; from: string; to: string };
type MockHold = { id: string; unitId: string; kind: HoldKind; guestName: string; from: string; to: string; expiresAt: string };

export type MockRecords = {
  reservations: readonly MockReservation[];
  holds: readonly MockHold[];
  blocks: readonly DateBlock[];
};

// Fixed clock so holds stay active in the mock (Asia/Colombo, +05:30).
const MOCK_NOW = "2026-10-21T09:00:00+05:30";
const MOCK_USER = "Nisal Rathnaka";
const NOTE_MAX = 200;

const ROOM_TYPES: RoomType[] = [
  { id: "deluxe", name: "Deluxe" },
  { id: "standard", name: "Standard" },
];

const UNITS: Unit[] = [
  { id: "room-1", name: "Room 1", roomTypeId: "deluxe", maxGuests: 3 },
  { id: "room-2", name: "Room 2", roomTypeId: "deluxe", maxGuests: 3 },
  { id: "room-3", name: "Room 3", roomTypeId: "deluxe", maxGuests: 3 },
  { id: "room-4", name: "Room 4", roomTypeId: "deluxe", maxGuests: 3 },
  { id: "room-5", name: "Room 5", roomTypeId: "standard", maxGuests: 2 },
  { id: "room-6", name: "Room 6", roomTypeId: "standard", maxGuests: 2 },
  // Single occupancy, so a 2-guest search shows "Capacity too small".
  { id: "room-7", name: "Room 7", roomTypeId: "standard", maxGuests: 1 },
  { id: "room-8", name: "Room 8", roomTypeId: "standard", maxGuests: 2 },
];

const reservations: MockReservation[] = [
  { id: "res-1", unitId: "room-3", guestName: "Kasun Fernando", from: "2026-10-21", to: "2026-10-24" },
  { id: "res-2", unitId: "room-8", guestName: "Sophie Martin", from: "2026-10-20", to: "2026-10-24" },
  { id: "res-3", unitId: "room-2", guestName: "Emily Carter", from: "2026-10-28", to: "2026-10-31" },
];

const holds: MockHold[] = [
  {
    id: "hold-1",
    unitId: "room-2",
    kind: "enquiry",
    guestName: "Arjun Mehta",
    from: "2026-10-21",
    to: "2026-10-24",
    expiresAt: "2026-10-21T14:30:00+05:30",
  },
];

let blocks: DateBlock[] = [
  {
    id: "block-1",
    unitId: "room-4",
    unitName: "Room 4",
    startDate: "2026-10-19",
    endDate: "2026-10-25",
    reason: "maintenance",
    note: "Bathroom retiling",
    createdByName: MOCK_USER,
    createdAt: "2026-10-15T10:24:00+05:30",
  },
];

let nextBlockId = 2;

// --- Date-only helpers ("YYYY-MM-DD" strings compare in calendar order) ---

function addDays(isoDay: string, days: number) {
  const date = new Date(`${isoDay}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// Half-open ranges [from, to): `to` is the check-out day / first free day.
function overlaps(aFrom: string, aTo: string, bFrom: string, bTo: string) {
  return aFrom < bTo && bFrom < aTo;
}

function blockEndExclusive(endDate: string) {
  return BLOCK_END_DATE_INCLUSIVE ? addDays(endDate, 1) : endDate;
}

// --- Pure status rule ---

// Works out one unit's status for a stay. Every rule that applies is
// collected, then STATUS_PRECEDENCE picks the winner. Pure: same inputs,
// same output, no clock or store access.
export function computeUnitAvailability(
  unit: Unit,
  params: AvailabilitySearchParams,
  records: MockRecords,
  now: string,
): UnitAvailability {
  const { arrival, departure, guests } = params;
  const candidates = new Map<UnitStatus, UnitAvailability>();

  const block = records.blocks.find(
    (b) => b.unitId === unit.id && overlaps(arrival, departure, b.startDate, blockEndExclusive(b.endDate)),
  );
  if (block) candidates.set("blocked", { unit, status: "blocked", blockReason: block.reason });

  const reservation = records.reservations.find(
    (r) => r.unitId === unit.id && overlaps(arrival, departure, r.from, r.to),
  );
  if (reservation) {
    candidates.set("booked", { unit, status: "booked", bookedFrom: reservation.from, bookedTo: reservation.to });
  }

  const nowMs = Date.parse(now);
  const hold = records.holds.find(
    (h) => h.unitId === unit.id && Date.parse(h.expiresAt) > nowMs && overlaps(arrival, departure, h.from, h.to),
  );
  if (hold) candidates.set("held", { unit, status: "held", heldUntil: hold.expiresAt, holdKind: hold.kind });

  if (guests > unit.maxGuests) {
    candidates.set("capacity_too_small", { unit, status: "capacity_too_small", requestedGuests: guests });
  }

  candidates.set("available", { unit, status: "available" });

  const winner = STATUS_PRECEDENCE.find((status) => candidates.has(status)) ?? "available";
  return candidates.get(winner) ?? { unit, status: "available" };
}

// Reservations, active holds and existing blocks that overlap a new block.
export function findBlockConflicts(input: CreateBlockInput, records: MockRecords, now: string): BlockConflict[] {
  const from = input.startDate;
  const to = blockEndExclusive(input.endDate);
  const unitName = (unitId: string) => UNITS.find((u) => u.id === unitId)?.name ?? unitId;
  const nowMs = Date.parse(now);
  const selected = new Set(input.unitIds);

  const fromReservations: BlockConflict[] = records.reservations
    .filter((r) => selected.has(r.unitId) && overlaps(from, to, r.from, r.to))
    .map((r) => ({
      id: r.id,
      kind: "reservation",
      unitName: unitName(r.unitId),
      guestName: r.guestName,
      status: "confirmed",
      from: r.from,
      to: r.to,
    }));

  const fromHolds: BlockConflict[] = records.holds
    .filter((h) => selected.has(h.unitId) && Date.parse(h.expiresAt) > nowMs && overlaps(from, to, h.from, h.to))
    .map((h) => ({
      id: h.id,
      kind: "hold",
      unitName: unitName(h.unitId),
      guestName: h.guestName,
      status: h.kind,
      from: h.from,
      to: h.to,
    }));

  const fromBlocks: BlockConflict[] = records.blocks
    .filter((b) => selected.has(b.unitId) && overlaps(from, to, b.startDate, blockEndExclusive(b.endDate)))
    .map((b) => ({
      id: b.id,
      kind: "block",
      unitName: b.unitName,
      status: "blocked",
      from: b.startDate,
      to: b.endDate,
    }));

  return [...fromReservations, ...fromHolds, ...fromBlocks];
}

// --- Mock API ---

function delay() {
  return new Promise<void>((resolve) => setTimeout(resolve, 300 + Math.random() * 300));
}

function records(): MockRecords {
  return { reservations, holds, blocks };
}

function validateStay(params: AvailabilitySearchParams) {
  const fieldErrors: Record<string, string> = {};
  if (params.departure <= params.arrival) fieldErrors.departure = "Departure must be after arrival.";
  if (!Number.isInteger(params.guests) || params.guests < 1) fieldErrors.guests = "Enter at least 1 guest.";
  if (Object.keys(fieldErrors).length > 0) throw apiError(422, "validation_failed", "Check the search details.", fieldErrors);
}

function validateBlock(input: CreateBlockInput) {
  const fieldErrors: Record<string, string> = {};
  if (input.unitIds.length === 0) fieldErrors.unitIds = "Select at least one unit.";
  if (input.endDate < input.startDate) fieldErrors.endDate = "End date can't be before the start date.";
  if ((input.note ?? "").length > NOTE_MAX) fieldErrors.note = `Keep the note under ${NOTE_MAX} characters.`;
  if (input.unitIds.some((id) => !UNITS.some((u) => u.id === id))) fieldErrors.unitIds = "One of the units no longer exists.";
  if (Object.keys(fieldErrors).length > 0) throw apiError(422, "validation_failed", "Check the block details.", fieldErrors);
}

export const mockAvailabilityApi: AvailabilityApi = {
  async searchAvailability(_propertyId, params) {
    await delay();
    validateStay(params);
    const units = UNITS.filter((u) => params.roomTypeId === "all" || u.roomTypeId === params.roomTypeId);
    const result: AvailabilityResult = {
      params: { ...params },
      roomTypes: ROOM_TYPES.map((t) => ({ ...t })),
      units: units.map((u) => structuredClone(computeUnitAvailability(u, params, records(), MOCK_NOW))),
    };
    const largest = Math.max(...units.map((u) => u.maxGuests));
    if (units.length > 0 && params.guests > largest) {
      result.restrictionViolation = {
        rule: "max_guests",
        message: `No room takes more than ${largest} guests. Split the group across rooms.`,
      };
    }
    return result;
  },

  async listBlocks() {
    await delay();
    return blocks.map((b) => ({ ...b })).sort((a, b) => a.startDate.localeCompare(b.startDate));
  },

  async checkBlockConflicts(_propertyId, input) {
    await delay();
    validateBlock(input);
    return findBlockConflicts(input, records(), MOCK_NOW);
  },

  async createBlock(_propertyId, input) {
    await delay();
    validateBlock(input);
    const conflicts = findBlockConflicts(input, records(), MOCK_NOW);
    if (conflicts.length > 0 && BLOCK_CONFLICT_BEHAVIOUR === "prevent") {
      throw apiError(409, "block_conflict", "These dates overlap existing reservations, holds or blocks.");
    }
    const createdAt = new Date().toISOString();
    const created: DateBlock[] = input.unitIds.map((unitId) => ({
      id: `block-${nextBlockId++}`,
      unitId,
      unitName: UNITS.find((u) => u.id === unitId)?.name ?? unitId,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason,
      note: input.note?.trim() || undefined,
      createdByName: MOCK_USER,
      createdAt,
    }));
    blocks = [...blocks, ...created];
    return created.map((b) => ({ ...b }));
  },

  async deleteBlock(_propertyId, blockId) {
    await delay();
    if (!blocks.some((b) => b.id === blockId)) throw apiError(404, "block_not_found", "This block was already removed.");
    blocks = blocks.filter((b) => b.id !== blockId);
  },
};
