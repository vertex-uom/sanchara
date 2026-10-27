import type { Residency } from "./types";

export type RatesTab = "rates" | "seasons" | "taxes";

export const RATES_TABS: { key: RatesTab; label: string }[] = [
  { key: "rates", label: "Rates" },
  { key: "seasons", label: "Seasons" },
  { key: "taxes", label: "Taxes" },
];

export const RESIDENCY_META: Record<Residency, { label: string; currency: string }> = {
  resident: { label: "Resident (LKR)", currency: "LKR" },
  "non-resident": { label: "Non-resident (USD)", currency: "USD" },
};

export const RESIDENCIES: readonly Residency[] = ["resident", "non-resident"];

// TODO(confirm): v8 has not set these limits.
export const RATE_LIMITS = { maxAmount: 10_000_000, planName: 40, planDescription: 120, seasonName: 40, maxSeasonDays: 366, maxPlans: 10 } as const;

export const RATES_ERROR_MESSAGES = {
  NOT_FOUND: "That item no longer exists.",
  STALE: "Rates were changed somewhere else. Reload the page to see the latest version.",
  LIMIT: "You've reached the maximum number of rate plans.",
  FORBIDDEN: "Only the Owner or a Manager can change rates and seasons.",
  FAILED: "Something went wrong. Try again.",
} as const;

export type RatesErrorCode = keyof typeof RATES_ERROR_MESSAGES;
