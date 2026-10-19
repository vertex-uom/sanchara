import type { PropertySummary } from "../types";

// TEMPORARY fixture. Replace the body with the company properties API call
// once the API client exists; the return type stays the same.
export async function getCompanyProperties(): Promise<PropertySummary[]> {
  return [
    { id: "palm-breeze", name: "Palm Breeze Guest House", town: "Galle", country: "Sri Lanka", imageUrl: null },
    { id: "lagoon-view", name: "Lagoon View Villa", town: "Bentota", country: "Sri Lanka", imageUrl: null },
  ];
}
