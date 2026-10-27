import { RATINGS, type Rating, type ReviewSummary } from "./types";

// The summary for a distribution: total is the sum, average the weighted
// mean rounded to one decimal (0 when there are no reviews).
export function summaryFromDistribution(distribution: Record<Rating, number>): ReviewSummary {
  const total = RATINGS.reduce((sum, rating) => sum + distribution[rating], 0);
  const points = RATINGS.reduce((sum, rating) => sum + rating * distribution[rating], 0);
  const average = total === 0 ? 0 : Math.round((points / total) * 10) / 10;
  return { average, total, distribution: { ...distribution } };
}
