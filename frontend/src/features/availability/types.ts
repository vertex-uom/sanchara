// Shapes returned by the availability API (mock now, NestJS later).
// Dates are date-only "YYYY-MM-DD"; instants are ISO strings with an offset.

export type UnitStatus = "available" | "held" | "booked" | "blocked" | "capacity_too_small";

export type HoldKind = "enquiry" | "pending_payment";

export type BlockReason = "maintenance" | "closure" | "other";

export type RoomType = { id: string; name: string };

export type Unit = {
  id: string;
  name: string;
  roomTypeId: string;
  maxGuests: number;
  photoUrl?: string;
};

export type UnitAvailability = {
  unit: Unit;
  status: UnitStatus;
  // Held: when the hold expires.
  heldUntil?: string;
  holdKind?: HoldKind;
  // Booked: the overlapping reservation's stay (check-out day exclusive).
  bookedFrom?: string;
  bookedTo?: string;
  // Blocked: why the unit is out of service.
  blockReason?: BlockReason;
  // Capacity too small: the guest count that was asked for.
  requestedGuests?: number;
};

// Every room type and unit of the property (Block dates unit picker).
export type PropertyUnits = { roomTypes: RoomType[]; units: Unit[] };

// roomTypeId "all" searches every room type.
export type AvailabilitySearchParams = {
  arrival: string;
  departure: string;
  guests: number;
  roomTypeId: string;
};

export type RestrictionRule = "min_stay" | "max_stay" | "max_guests" | "booking_window";

export type AvailabilityResult = {
  params: AvailabilitySearchParams;
  // Every room type of the property, in display order (headings and filter chips).
  roomTypes: RoomType[];
  units: UnitAvailability[];
  restrictionViolation?: { rule: RestrictionRule; message: string };
};

export type DateBlock = {
  id: string;
  unitId: string;
  unitName: string;
  startDate: string;
  endDate: string;
  reason: BlockReason;
  note?: string;
  createdByName: string;
  createdAt: string;
};

export type ConflictKind = "reservation" | "hold" | "block";

export type ConflictStatus = "confirmed" | "pending_payment" | "enquiry" | "blocked";

export type BlockConflict = {
  id: string;
  kind: ConflictKind;
  unitName: string;
  guestName?: string;
  status: ConflictStatus;
  from: string;
  to: string;
};

export type CreateBlockInput = {
  unitIds: string[];
  startDate: string;
  endDate: string;
  reason: BlockReason;
  note?: string;
};
