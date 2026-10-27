import type { Money } from "@/lib/format/money";

export type ReservationStatus = "pending-payment" | "confirmed" | "checked-in" | "checked-out" | "cancelled" | "no-show";

// One reservation match, as returned by the search API.
export type ReservationHit = {
  id: string;
  reference: string;
  guestName: string;
  unitLabel: string;
  checkIn: string;
  checkOut: string;
  status: ReservationStatus;
  total: Money;
};

// One guest match. Phone and email may be missing for walk-ins.
export type GuestHit = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  stays: number;
};

export type SearchResults = { reservations: ReservationHit[]; guests: GuestHit[] };
