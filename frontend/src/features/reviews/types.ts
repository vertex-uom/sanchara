// Shapes returned by the reviews API (mock now, NestJS later).
// Dates are date-only "YYYY-MM-DD"; createdAt is an ISO instant with offset.

export type Rating = 1 | 2 | 3 | 4 | 5;

export const RATINGS: readonly Rating[] = [5, 4, 3, 2, 1];

export interface ReviewSummary {
  // Computed from the distribution (one decimal), never stored.
  average: number;
  total: number;
  distribution: Record<Rating, number>;
}

// Every review is public and comes from a verified stay. Only the guest's
// first name and last-name initial are exposed ("James P."), never contact details.
export interface Review {
  id: string;
  guestName: string;
  rating: Rating;
  comment?: string;
  createdAt: string;
  stayFrom: string;
  stayTo: string;
  unitName: string;
  verifiedStay: true;
}

export type ReviewSort = "newest" | "oldest" | "highest" | "lowest";

export interface ReviewFilters {
  rating: Rating | "all";
  sort: ReviewSort;
  query: string;
}

export interface ListReviewsParams {
  rating?: Rating;
  sort: ReviewSort;
  query?: string;
  // From the previous page's nextCursor; left out for the first page.
  cursor?: string;
}

export interface ReviewPage {
  reviews: Review[];
  // Null when there is nothing more to load.
  nextCursor: string | null;
  // Reviews matching the rating and search, across all pages.
  total: number;
}
