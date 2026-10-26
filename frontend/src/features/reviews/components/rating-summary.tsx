import { Star } from "lucide-react";
import { Skeleton } from "@/components/ui/widget";
import { cn } from "@/lib/utils";
import { RATING_BAR } from "../status-tokens";
import { RATINGS, type Rating, type ReviewSummary } from "../types";
import { StarRating } from "./star-rating";

const CARD = "rounded-[12px] border border-border bg-card p-5";

function starsLabel(rating: Rating) {
  return `${rating} ${rating === 1 ? "star" : "stars"}`;
}

function reviewsLabel(count: number) {
  return `${count} ${count === 1 ? "review" : "reviews"}`;
}

type RatingSummaryProps = {
  // Null while loading.
  summary: ReviewSummary | null;
  error?: string;
};

// Average rating card (1/3) and the reviews-by-rating bars (2/3).
export function RatingSummary({ summary, error }: RatingSummaryProps) {
  return (
    <section aria-label="Rating summary" className="grid gap-4 lg:grid-cols-3">
      <div className={cn(CARD, "flex flex-col justify-center")}>
        {error ? (
          <p role="alert" className="text-sm font-medium text-office-danger-text">
            {error}
          </p>
        ) : summary ? (
          <>
            <div className="flex items-center gap-3">
              <Star aria-hidden="true" className="size-7 shrink-0 text-office-icon" strokeWidth={1.5} />
              <p className="text-4xl leading-none font-bold text-foreground">
                {summary.average.toFixed(1)}
                <span className="sr-only"> out of 5 average rating</span>
              </p>
              <StarRating value={summary.average} className="text-xl" />
            </div>
            <p className="mt-2 pl-10 text-sm text-office-muted">{reviewsLabel(summary.total)}</p>
          </>
        ) : (
          <div aria-busy="true">
            <span className="sr-only">Loading rating summary</span>
            <Skeleton className="h-10 w-48" />
            <Skeleton className="mt-3 h-4 w-24" />
          </div>
        )}
      </div>

      <div className={cn(CARD, "lg:col-span-2")}>
        <h2 className="text-sm font-semibold text-foreground">Reviews by rating</h2>
        {summary ? (
          <ul className="mt-3 flex flex-col gap-2">
            {RATINGS.map((rating) => {
              const count = summary.distribution[rating];
              const share = summary.total === 0 ? 0 : (count / summary.total) * 100;
              return (
                <li key={rating} className="grid grid-cols-[3.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-xs">
                  <span aria-hidden="true" className="text-office-label">
                    {starsLabel(rating)}
                  </span>
                  <span
                    role="img"
                    aria-label={`${starsLabel(rating)}: ${reviewsLabel(count)}`}
                    className={cn("h-2 overflow-hidden rounded-full", RATING_BAR.track)}
                  >
                    <span className={cn("block h-full rounded-full", RATING_BAR.fill)} style={{ width: `${share}%` }} />
                  </span>
                  <span aria-hidden="true" className="text-right text-office-label tabular-nums">
                    {count}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : error ? null : (
          <div aria-busy="true" className="mt-3 flex flex-col gap-3">
            {RATINGS.map((rating) => (
              <Skeleton key={rating} className="h-3 rounded-full" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
