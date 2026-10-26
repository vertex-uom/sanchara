"use client";

// DEV ONLY: renders the Reviews page in states the mock data can't show
// (loading, error, no reviews yet). Used by app/backoffice/(dev)/reviews-test.
// Lives in the feature so the client bundle doesn't pull in server code from
// the feature's entry point. Delete with the dev page.
import { apiError } from "@/lib/api-client/errors";
import type { ReviewsApi } from "../api";
import { ReviewsWorkspace } from "./reviews-workspace";

export type ReviewsDevVariant = "loading" | "error" | "empty";

const never = () => new Promise<never>(() => undefined);
const fail = () => Promise.reject(apiError(500, "server_error", "Server error."));

const APIS: Record<ReviewsDevVariant, ReviewsApi> = {
  loading: { getSummary: never, listReviews: never },
  error: { getSummary: fail, listReviews: fail },
  empty: {
    getSummary: async () => ({ average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }),
    listReviews: async () => ({ reviews: [], nextCursor: null, total: 0 }),
  },
};

const PLACE = { name: "Palm Breeze Guest House", location: "Galle, Sri Lanka" };

export function ReviewsDevVariantView({ variant }: { variant: ReviewsDevVariant }) {
  return (
    <main className="flex flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
      <p className="rounded-lg bg-office-tint-orange px-3 py-2 text-sm text-office-label">Dev variant: {variant}</p>
      <ReviewsWorkspace propertyId="palm-breeze" place={PLACE} api={APIS[variant]} />
    </main>
  );
}
