"use client";

import { PageHeader } from "@/components/ui/page-header";
import { useReviews } from "../hooks/use-reviews";
import { RatingSummary } from "./rating-summary";

type ReviewsWorkspaceProps = {
  propertyId: string;
  place: { name: string; location: string };
};

// Reviews page body: header and rating summary (filters and the list come
// in the next parts). Read-only: no reply, hide, delete or report controls.
export function ReviewsWorkspace({ propertyId, place }: ReviewsWorkspaceProps) {
  const { summary, summaryError } = useReviews(propertyId);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Reviews" place={place} titleClassName="font-bold text-brand-tropical" />
      <RatingSummary summary={summary} error={summaryError?.message} />
    </div>
  );
}
