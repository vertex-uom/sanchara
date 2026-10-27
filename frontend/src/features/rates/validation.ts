import { isIsoDate } from "@/lib/format/dates";
import { RATE_LIMITS } from "./config";
import type { Season } from "./types";

type Result<T> = { ok: true; value: T } | { ok: false; fieldErrors: Record<string, string> };

const DAY_MS = 24 * 60 * 60 * 1000;

// Grid cells arrive as "rate:<roomTypeId>:<column>" → the typed amount.
export type RateInput = Record<string, string>;

// Amounts in minor units by room type and column; null clears the cell.
export type RateUpdate = Record<string, Record<string, number | null>>;

// Base rates are required; season cells may be empty (they use the base rate).
// LKR takes whole rupees, USD up to two decimals.
export function validateRates(input: RateInput, roomTypeIds: string[], columns: string[], currency: string): Result<RateUpdate> {
  const errors: Record<string, string> = {};
  const update: RateUpdate = {};
  const decimals = currency === "LKR" ? 0 : 2;
  const pattern = decimals === 0 ? /^\d{1,9}$/ : /^\d{1,9}(\.\d{1,2})?$/;

  for (const roomTypeId of roomTypeIds) {
    update[roomTypeId] = {};
    for (const column of columns) {
      const key = `rate:${roomTypeId}:${column}`;
      const raw = (input[key] ?? "").replace(/[,\s]/g, "");
      if (!raw) {
        if (column === "base") errors[key] = "Enter the base rate.";
        update[roomTypeId][column] = null;
        continue;
      }
      const amount = Number(raw);
      if (!pattern.test(raw) || amount <= 0 || amount > RATE_LIMITS.maxAmount) {
        errors[key] = decimals === 0 ? "Enter a whole amount in rupees." : "Enter an amount, like 120 or 120.50.";
        continue;
      }
      update[roomTypeId][column] = Math.round(amount * 100);
    }
  }
  return Object.keys(errors).length > 0 ? { ok: false, fieldErrors: errors } : { ok: true, value: update };
}

export type SeasonInput = { name: string; from: string; to: string };

// Seasons may not overlap; others excludes the season being edited.
export function validateSeason(input: SeasonInput, others: Season[]): Result<Omit<Season, "id">> {
  const errors: Record<string, string> = {};
  const name = input.name.trim();
  const { from, to } = input;
  if (!name) errors.name = "Enter the season name.";
  else if (name.length > RATE_LIMITS.seasonName) errors.name = `Use ${RATE_LIMITS.seasonName} characters or fewer.`;
  if (!isIsoDate(from)) errors.from = "Enter the start date.";
  if (!isIsoDate(to)) errors.to = "Enter the end date.";

  if (!errors.from && !errors.to) {
    const days = (Date.parse(to) - Date.parse(from)) / DAY_MS + 1;
    if (days < 1) errors.to = "The end date must be on or after the start date.";
    else if (days > RATE_LIMITS.maxSeasonDays) errors.to = "A season can be at most a year long.";
    else {
      const clash = others.find((season) => from <= season.to && season.from <= to);
      if (clash) errors.from = `These dates overlap ${clash.name}. Seasons can't overlap.`;
    }
  }
  return Object.keys(errors).length > 0 ? { ok: false, fieldErrors: errors } : { ok: true, value: { name, from, to } };
}

export type PlanInput = { name: string; description: string; copyFrom: string };

export function validatePlan(input: PlanInput, existingNames: string[]): Result<{ name: string; description: string; copyFrom: string | null }> {
  const errors: Record<string, string> = {};
  const name = input.name.trim();
  const description = input.description.trim();
  if (!name) errors.name = "Enter the rate plan name.";
  else if (name.length > RATE_LIMITS.planName) errors.name = `Use ${RATE_LIMITS.planName} characters or fewer.`;
  else if (existingNames.some((existing) => existing.toLowerCase() === name.toLowerCase())) errors.name = "A rate plan with this name already exists.";
  if (description.length > RATE_LIMITS.planDescription) errors.description = `Use ${RATE_LIMITS.planDescription} characters or fewer.`;
  return Object.keys(errors).length > 0
    ? { ok: false, fieldErrors: errors }
    : { ok: true, value: { name, description, copyFrom: input.copyFrom || null } };
}
