// Shapes returned by the rooms API (mock now, NestJS later).

export interface RoomType {
  id: string;
  name: string;
  description?: string;
}

// A named, bookable unit ("Room 1"). Names are unique within a property.
export interface RoomUnit {
  id: string;
  name: string;
  roomTypeId: string;
  maxGuests: number;
  isActive: boolean;
  photoUrl?: string;
  // Upcoming confirmed reservations; affects whether it can be made inactive.
  hasFutureReservations: boolean;
}

export interface UpdateUnitInput {
  name: string;
  roomTypeId: string;
  maxGuests: number;
  isActive: boolean;
}

export type CreateUnitInput = UpdateUnitInput;

export interface RoomTypeInput {
  name: string;
  description?: string;
}

export interface RoomStats {
  roomTypes: number;
  units: number;
  activeUnits: number;
}
