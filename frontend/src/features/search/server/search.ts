import { SEARCH_GROUP_LIMIT } from "../config";
import type { GuestHit, ReservationHit, SearchResults } from "../types";

const lkr = (rupees: number) => ({ amountMinor: rupees * 100, currency: "LKR" });

// TEMPORARY fixture. Replace the body of searchProperty with the search API
// call once the API client exists; the signature stays the same.
const RESERVATIONS: ReservationHit[] = [
  { id: "res_1042", reference: "58K-1042", guestName: "Sarath Kumara", unitLabel: "Room 2", checkIn: "2026-10-26", checkOut: "2026-10-28", status: "confirmed", total: lkr(49_000) },
  { id: "res_1041", reference: "58K-1041", guestName: "Dilani Fernando", unitLabel: "Sea View Room", checkIn: "2026-10-24", checkOut: "2026-10-26", status: "checked-in", total: lkr(56_000) },
  { id: "res_1040", reference: "58K-1040", guestName: "Emma Schultz", unitLabel: "Garden Room", checkIn: "2026-10-27", checkOut: "2026-10-30", status: "pending-payment", total: lkr(73_500) },
  { id: "res_1039", reference: "58K-1039", guestName: "Kasun Jayawardena", unitLabel: "Room 4", checkIn: "2026-10-20", checkOut: "2026-10-22", status: "checked-out", total: lkr(42_000) },
  { id: "res_1038", reference: "58K-1038", guestName: "Priya Raman", unitLabel: "Room 1", checkIn: "2026-10-26", checkOut: "2026-10-27", status: "no-show", total: lkr(24_500) },
  { id: "res_1037", reference: "58K-1037", guestName: "Oliver Brown", unitLabel: "Sea View Room", checkIn: "2026-11-02", checkOut: "2026-11-05", status: "cancelled", total: lkr(84_000) },
  { id: "res_1036", reference: "58K-1036", guestName: "Sarath Kumara", unitLabel: "Room 2", checkIn: "2026-08-14", checkOut: "2026-08-16", status: "checked-out", total: lkr(47_000) },
];

const GUESTS: GuestHit[] = [
  { id: "guest_1", fullName: "Sarath Kumara", phone: "+94 77 123 4567", email: "sarath.k@example.com", stays: 2 },
  { id: "guest_2", fullName: "Dilani Fernando", phone: "+94 71 555 0192", email: "dilani@example.com", stays: 1 },
  { id: "guest_3", fullName: "Emma Schultz", phone: "+49 151 2345 6789", email: "emma.schultz@example.de", stays: 1 },
  { id: "guest_4", fullName: "Kasun Jayawardena", phone: "+94 76 888 1203", email: null, stays: 3 },
  { id: "guest_5", fullName: "Priya Raman", phone: null, email: "priya.raman@example.com", stays: 1 },
  { id: "guest_6", fullName: "Oliver Brown", phone: "+44 7700 900123", email: "oliver.b@example.co.uk", stays: 1 },
];

const digits = (value: string) => value.replace(/\D/g, "");

function matches(query: string, texts: (string | null)[], phone: string | null = null) {
  const lower = query.toLowerCase().replace(/^#/, "");
  const queryDigits = digits(query);
  return (
    texts.some((text) => text?.toLowerCase().includes(lower)) ||
    (phone !== null && queryDigits.length >= 3 && digits(phone).includes(queryDigits))
  );
}

// Reservations by reference or guest name; guests by name, phone or email.
// Newest stays first.
export async function searchProperty(propertyId: string, query: string): Promise<SearchResults> {
  void propertyId;
  return {
    reservations: RESERVATIONS.filter((r) => matches(query, [r.reference, r.guestName]))
      .toSorted((a, b) => b.checkIn.localeCompare(a.checkIn))
      .slice(0, SEARCH_GROUP_LIMIT),
    guests: GUESTS.filter((g) => matches(query, [g.fullName, g.email], g.phone)).slice(0, SEARCH_GROUP_LIMIT),
  };
}
