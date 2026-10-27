"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { FOCUS_SCOPE } from "@/components/ui/focus-scope";
import type { ReviewsApi } from "../api";
import { DEFAULT_REVIEW_FILTERS, useReviews } from "../hooks/use-reviews";
import { INFO_NOTE } from "../status-tokens";
import { RatingSummary } from "./rating-summary";
import { ReviewList } from "./review-list";
import { ReviewsToolbar } from "./reviews-toolbar";

type ReviewsWorkspaceProps = {
  propertyId: string;
  place: { name: string; location: string };
  // For the dev page only; the app uses the default API.
  api?: ReviewsApi;
};

// Reviews page body: header, rating summary, toolbar, public note and the
// list. Read-only: no reply, hide, delete or report controls.
export function ReviewsWorkspace({ propertyId, place, api }: ReviewsWorkspaceProps) {
  const { summary, summaryError, reviews, total, filters, setFilters, loading, loadingMore, hasMore, error, loadMore, retry } =
    useReviews(propertyId, api);
  // Bumped by Clear filters so the search box empties too.
  const [resetKey, setResetKey] = useState(0);

  function clearFilters() {
    setFilters(DEFAULT_REVIEW_FILTERS);
    setResetKey((key) => key + 1);
  }

  const noReviewsYet = summary !== null && summary.total === 0;

  return (
    <div className={cn(FOCUS_SCOPE, "flex flex-col gap-5")}>
      <PageHeader title="Reviews" place={place} titleClassName="font-bold text-brand-tropical" />
      <RatingSummary summary={summary} error={summaryError?.message} />

      <section aria-label="Guest reviews" className="flex flex-col gap-4">
        {/* Nothing to filter until there are reviews. */}
        {noReviewsYet ? null : <ReviewsToolbar filters={filters} onChange={setFilters} resetKey={resetKey} />}

        <p className={cn("flex items-center gap-2 rounded-[12px] px-4 py-2.5 text-sm", INFO_NOTE)}>
          <Info aria-hidden="true" className="size-4 shrink-0 text-office-ink-blue" />
          Reviews are public. Staff cannot reply to or hide reviews.
        </p>

        <ReviewList
          reviews={reviews}
          total={total}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          error={error?.message}
          noReviewsYet={noReviewsYet}
          onLoadMore={() => void loadMore()}
          onClearFilters={clearFilters}
          onRetry={retry}
        />
      </section>
    </div>
  );
}
