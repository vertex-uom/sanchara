import type { TodayAtAGlance } from "../types";

// TEMPORARY fixture. Replace the body with the reservations API call once
// the API client exists; the return type stays the same.
export async function getTodayAtAGlance(propertyId: string): Promise<TodayAtAGlance> {
  void propertyId;
  return { arrivals: 3, departures: 2, inHouse: 6, unitsAvailableTonight: 4, noShows: 0 };
}
