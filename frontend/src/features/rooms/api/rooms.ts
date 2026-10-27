import type { CreateUnitInput, RoomType, RoomTypeInput, RoomUnit, UpdateUnitInput } from "../types";

// Contract the UI talks to. The mock implements it today; the NestJS client
// will implement the same interface. Failures reject with an ApiError.
export interface RoomsApi {
  listRoomTypes(propertyId: string): Promise<RoomType[]>;
  listUnits(propertyId: string): Promise<RoomUnit[]>;
  createUnit(propertyId: string, input: CreateUnitInput): Promise<RoomUnit>;
  updateUnit(propertyId: string, unitId: string, input: UpdateUnitInput): Promise<RoomUnit>;
  createRoomType(propertyId: string, input: RoomTypeInput): Promise<RoomType>;
  updateRoomType(propertyId: string, roomTypeId: string, input: RoomTypeInput): Promise<RoomType>;
}
