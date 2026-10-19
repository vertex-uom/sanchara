import type { Money } from "@/lib/format/money";
import type { KpiKey, KpiPeriod } from "./config";

// KPI values are calculated by the API; the frontend only formats them.
// Money KPIs are a list because report currency handling is undecided
// (a property can take LKR and USD reservations).
export type KpiValue =
  | { kind: "ratio"; ratio: number }
  | { kind: "money"; amounts: Money[] }
  | { kind: "count"; count: number };

export type KpiChange = {
  ratio: number; // 0.12 = +12%, -0.05 = -5%
  comparisonLabel: string; // "vs last month"
};

export type Kpi = {
  key: KpiKey;
  period: KpiPeriod;
  value: KpiValue;
  change: KpiChange | null;
  // Data points for the sparkline, oldest first.
  series: number[];
};
