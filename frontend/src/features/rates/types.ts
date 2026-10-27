import type { Money } from "@/lib/format/money";

// Residents pay in LKR, non-residents in USD (docs/backend-architecture.md).
export type Residency = "resident" | "non-resident";

export type RoomTypeOption = { id: string; name: string };

export type RatePlan = { id: string; name: string; description: string };

// Dates are date-only "YYYY-MM-DD", both ends inclusive. A season may run
// into the next year (Dec – Feb).
export type Season = { id: string; name: string; from: string; to: string };

// "base" is the all-year rate; a season without its own rate uses it.
export type RateColumn = "base" | string;

// One plan and residency: price per room type and column, null when not set.
export type RateGrid = Record<string, Record<RateColumn, Money | null>>;

export type RatesView = {
  roomTypes: RoomTypeOption[];
  plans: RatePlan[];
  seasons: Season[];
  // For the selected plan and residency.
  grid: RateGrid;
  currency: string;
  // Bumped on every rates save; a stale save is refused.
  version: number;
};

// Shown read-only: tax formulas and rates are platform configuration (v8 open).
export type TaxLine = { id: string; name: string; description: string; rate: string | null };
