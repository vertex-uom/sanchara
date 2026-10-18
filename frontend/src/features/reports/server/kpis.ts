import type { KpiKey, KpiPeriod } from "../config";
import type { Kpi, KpiValue } from "../types";

type FixtureRow = { value: KpiValue; changeRatio: number };

const lkr = (amountMinor: number): KpiValue => ({ kind: "money", amounts: [{ amountMinor, currency: "LKR" }] });

const FIXTURE: Record<KpiPeriod, { comparisonLabel: string; rows: Record<KpiKey, FixtureRow> }> = {
  "this-month": {
    comparisonLabel: "vs last month",
    rows: {
      occupancy: { value: { kind: "ratio", ratio: 0.68 }, changeRatio: 0.12 },
      adr: { value: lkr(2_450_000), changeRatio: 0.08 },
      revpar: { value: lkr(1_666_000), changeRatio: 0.14 },
      roomNightsSold: { value: { kind: "count", count: 204 }, changeRatio: 0.11 },
    },
  },
  "last-month": {
    comparisonLabel: "vs previous month",
    rows: {
      occupancy: { value: { kind: "ratio", ratio: 0.61 }, changeRatio: -0.03 },
      adr: { value: lkr(2_270_000), changeRatio: 0.02 },
      revpar: { value: lkr(1_384_700), changeRatio: -0.01 },
      roomNightsSold: { value: { kind: "count", count: 183 }, changeRatio: -0.04 },
    },
  },
  "last-30-days": {
    comparisonLabel: "vs previous 30 days",
    rows: {
      occupancy: { value: { kind: "ratio", ratio: 0.66 }, changeRatio: 0.09 },
      adr: { value: lkr(2_410_000), changeRatio: 0.06 },
      revpar: { value: lkr(1_590_600), changeRatio: 0.12 },
      roomNightsSold: { value: { kind: "count", count: 198 }, changeRatio: 0.08 },
    },
  },
  "year-to-date": {
    comparisonLabel: "vs same period last year",
    rows: {
      occupancy: { value: { kind: "ratio", ratio: 0.59 }, changeRatio: 0.15 },
      adr: { value: lkr(2_310_000), changeRatio: 0.1 },
      revpar: { value: lkr(1_362_900), changeRatio: 0.18 },
      roomNightsSold: { value: { kind: "count", count: 1_790 }, changeRatio: 0.13 },
    },
  },
};

const RISING = [42, 45, 44, 48, 50, 49, 53, 55, 54, 58, 60, 59, 63, 66, 70];
const FALLING = [64, 66, 63, 65, 61, 62, 60, 58, 59, 57, 55, 56, 54, 53, 52];

// TEMPORARY fixture. Replace the body with the reports API call once the
// API client exists; the return type stays the same.
export async function getKpi(propertyId: string, key: KpiKey, period: KpiPeriod): Promise<Kpi> {
  void propertyId;
  const { comparisonLabel, rows } = FIXTURE[period];
  const row = rows[key];
  return {
    key,
    period,
    value: row.value,
    change: { ratio: row.changeRatio, comparisonLabel },
    series: row.changeRatio >= 0 ? RISING : FALLING,
  };
}
