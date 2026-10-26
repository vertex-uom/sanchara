import type {
  AvailabilityResult,
  AvailabilitySearchParams,
  BlockConflict,
  CreateBlockInput,
  DateBlock,
} from "../types";

// Contract the UI talks to. The mock implements it today; the NestJS client
// will implement the same interface. Failures reject with an ApiError.
export interface AvailabilityApi {
  searchAvailability(propertyId: string, params: AvailabilitySearchParams): Promise<AvailabilityResult>;
  listBlocks(propertyId: string): Promise<DateBlock[]>;
  checkBlockConflicts(propertyId: string, input: CreateBlockInput): Promise<BlockConflict[]>;
  createBlock(propertyId: string, input: CreateBlockInput): Promise<DateBlock[]>;
  deleteBlock(propertyId: string, blockId: string): Promise<void>;
}
