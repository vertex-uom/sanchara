import type { ListReviewsParams, ReviewPage, ReviewSummary } from "../types";

// Contract the UI talks to. The mock implements it today; the NestJS client
// will implement the same interface. Failures reject with an ApiError.
// Read-only: there are no write methods by design.
export interface ReviewsApi {
  getSummary(propertyId: string): Promise<ReviewSummary>;
  listReviews(propertyId: string, params: ListReviewsParams): Promise<ReviewPage>;
}
