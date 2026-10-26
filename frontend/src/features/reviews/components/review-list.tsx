"use client";

import { CircleAlert, LoaderCircle, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/widget";
import type { Review } from "../types";
import { ReviewRow } from "./review-row";

const OUTLINE_BUTTON = "h-11 gap-2 rounded-lg bg-card px-4 text-sm font-semibold text-brand-tropical md:h-10";

type ReviewListProps = {
  reviews: Review[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error?: string;
  onLoadMore: () => void;
  onClearFilters: () => void;
  onRetry: () => void;
};

// Reviews for the current filters, five at a time, with "Load more".
export function ReviewList({ reviews, total, loading, loadingMore, hasMore, error, onLoadMore, onClearFilters, onRetry }: ReviewListProps) {
  if (error && reviews.length === 0) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 rounded-[12px] border border-border bg-card px-4 py-12 text-center">
        <CircleAlert aria-hidden="true" className="size-8 text-office-danger" strokeWidth={1.5} />
        <p className="font-semibold text-foreground">Could not load reviews</p>
        <Button type="button" variant="outline" onClick={onRetry} className={OUTLINE_BUTTON}>
          Retry
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div aria-busy="true" className="flex flex-col gap-3">
        <span className="sr-only">Loading reviews</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3 rounded-[12px] border border-border bg-card p-4">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="mt-2 h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[12px] border border-border bg-card px-4 py-12 text-center">
        <SearchX aria-hidden="true" className="size-8 text-office-icon" strokeWidth={1.5} />
        <p className="font-semibold text-foreground">No reviews match your filters</p>
        <Button type="button" variant="outline" onClick={onClearFilters} className={OUTLINE_BUTTON}>
          Clear filters
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {reviews.map((review) => (
          <li key={review.id}>
            <ReviewRow review={review} />
          </li>
        ))}
      </ul>

      <div className="flex flex-col items-center gap-2 pt-2">
        <p aria-live="polite" className="text-sm text-office-muted">
          Showing {reviews.length} of {total}
        </p>
        {error ? (
          <p role="alert" className="text-sm font-medium text-office-danger-text">
            {error}
          </p>
        ) : null}
        {hasMore ? (
          <Button
            type="button"
            variant="outline"
            onClick={onLoadMore}
            disabled={loadingMore}
            aria-busy={loadingMore || undefined}
            className={OUTLINE_BUTTON}
          >
            {loadingMore ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : null}
            {loadingMore ? "Loading…" : "Load more reviews"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
