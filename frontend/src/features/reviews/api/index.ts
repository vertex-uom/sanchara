import type { ReviewsApi } from "./reviews";
import { mockReviewsApi } from "./reviews.mock";

export type { ReviewsApi } from "./reviews";

// The implementation the app uses. Swap for the NestJS client when it lands;
// nothing else changes.
export const reviewsApi: ReviewsApi = mockReviewsApi;
