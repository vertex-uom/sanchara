// TODO(confirm): v8 has not defined the KPI period options yet.
export const KPI_PERIODS = [
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "last-30-days", label: "Last 30 days" },
  { value: "year-to-date", label: "Year to date" },
] as const;

export type KpiPeriod = (typeof KPI_PERIODS)[number]["value"];

export const DEFAULT_KPI_PERIOD: KpiPeriod = "this-month";

export const KPI_KEYS = ["occupancy", "adr", "revpar", "roomNightsSold"] as const;

export type KpiKey = (typeof KPI_KEYS)[number];

// URL search param holding each card's selected period (e.g. ?adr=last-month).
export const KPI_PERIOD_PARAMS: Record<KpiKey, string> = {
  occupancy: "occupancy",
  adr: "adr",
  revpar: "revpar",
  roomNightsSold: "roomNights",
};

export function parseKpiPeriod(value: string | string[] | undefined): KpiPeriod {
  const match = KPI_PERIODS.find((period) => period.value === value);
  return match ? match.value : DEFAULT_KPI_PERIOD;
}

// Reports page tabs. Which of these a plan includes comes from the API.
export const REPORT_KEYS = ["occupancy", "revenue", "tax", "cancellations", "reviews"] as const;

export type ReportKey = (typeof REPORT_KEYS)[number];

export const DEFAULT_REPORT: ReportKey = "occupancy";

export const REPORT_LABELS: Record<ReportKey, string> = {
  occupancy: "Occupancy",
  revenue: "Revenue",
  tax: "Tax",
  cancellations: "Cancellations",
  reviews: "Reviews",
};

export const ALL_ROOM_TYPES = "all";

export function kpiPeriodLabel(period: KpiPeriod) {
  return KPI_PERIODS.find((option) => option.value === period)?.label ?? period;
}
