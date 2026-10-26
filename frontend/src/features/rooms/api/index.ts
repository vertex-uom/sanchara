import type { RoomsApi } from "./rooms";
import { mockRoomsApi } from "./rooms.mock";

export type { RoomsApi } from "./rooms";

// The implementation the app uses. Swap for the NestJS client when it lands;
// nothing else changes.
export const roomsApi: RoomsApi = mockRoomsApi;
