import type { Money } from "file:///D:/Nisal/software%20project/sanchara/.claude/scratch/reports-logic/lib/format/money.ts";
import type { KpiKey, KpiPeriod, ReportKey } from "./config.ts";

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

export type RoomTypeOption = { id: string; name: string };

// One point of the "Occupancy by day" chart; date is "YYYY-MM-DD".
export type OccupancyDay = { date: string; ratio: number };

export type RoomTypeOccupancy = RoomTypeOption & { ratio: number };

export type OccupancyReport = {
  kpis: Record<KpiKey, KpiValue>;
  byDay: OccupancyDay[];
  byRoomType: RoomTypeOccupancy[];
};

// Everything the Reports page shows, calculated by the API.
export type ReportsData = {
  // Reports the property's plan includes, in display order.
  reports: ReportKey[];
  roomTypes: RoomTypeOption[];
  // null when the selected range has no data.
  occupancy: OccupancyReport | null;
};
