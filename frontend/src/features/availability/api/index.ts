import type { AvailabilityApi } from "./availability";
import { mockAvailabilityApi } from "./availability.mock";

export type { AvailabilityApi } from "./availability";

// The implementation the app uses. Swap for the NestJS client when it lands;
// nothing else changes.
export const availabilityApi: AvailabilityApi = mockAvailabilityApi;
