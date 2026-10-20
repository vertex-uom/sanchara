import { REPORT_KEYS } from "../config";
import type { ReportFilters } from "../report-filters";
import type { KpiValue, OccupancyReport, ReportsData, RoomTypeOption } from "../types";

type RoomTypeFixture = RoomTypeOption & { units: number; nightlyRateMinor: number; demand: number };

const ROOM_TYPES: RoomTypeFixture[] = [
  { id: "deluxe", name: "Deluxe", units: 12, nightlyRateMinor: 1_950_000, demand: 0.08 },
  { id: "standard", name: "Standard", units: 14, nightlyRateMinor: 1_500_000, demand: -0.06 },
];

// The fixture only has bookings on the books for 2026; other dates are empty.
const DATA_FROM = "2026-01-01";
const DATA_TO = "2026-12-31";
const DAY_MS = 24 * 60 * 60 * 1000;

const lkr = (amountMinor: number): KpiValue => ({
  kind: "money",
  amounts: [{ amountMinor: Math.round(amountMinor / 100) * 100, currency: "LKR" }],
});

function datesBetween(from: string, to: string) {
  const dates: string[] = [];
  const end = Date.parse(to < DATA_TO ? to : DATA_TO);
  for (let time = Date.parse(from > DATA_FROM ? from : DATA_FROM); time <= end; time += DAY_MS) {
    dates.push(new Date(time).toISOString().slice(0, 10));
  }
  return dates;
}

// Repeatable demand wave, so every range shows the same numbers on reload.
function unitsSold(type: RoomTypeFixture, date: string) {
  const day = Date.parse(date) / DAY_MS;
  const ratio = 0.6 + type.demand + 0.1 * Math.sin(day / 2.5) + 0.06 * Math.sin(day / 0.9);
  return Math.min(type.units, Math.max(0, Math.round(type.units * ratio)));
}

// Figures stay consistent: RevPAR = ADR × occupancy, nights sold ≤ capacity.
function occupancyFor(types: RoomTypeFixture[], dates: string[]): OccupancyReport {
  const unitsPerNight = types.reduce((sum, type) => sum + type.units, 0);
  const capacity = unitsPerNight * dates.length;
  const soldByType = types.map((type) => dates.reduce((sum, date) => sum + unitsSold(type, date), 0));
  const sold = soldByType.reduce((sum, nights) => sum + nights, 0);
  const revenueMinor = types.reduce((sum, type, index) => sum + soldByType[index] * type.nightlyRateMinor, 0);

  return {
    kpis: {
      occupancy: { kind: "ratio", ratio: sold / capacity },
      adr: lkr(sold === 0 ? 0 : revenueMinor / sold),
      revpar: lkr(revenueMinor / capacity),
      roomNightsSold: { kind: "count", count: sold },
    },
    byDay: dates.map((date) => ({
      date,
      ratio: types.reduce((sum, type) => sum + unitsSold(type, date), 0) / unitsPerNight,
    })),
    byRoomType: types.map((type, index) => ({
      id: type.id,
      name: type.name,
      ratio: soldByType[index] / (type.units * dates.length),
    })),
  };
}

// TEMPORARY fixture. Replace the body with the reports API call once the
// API client exists; the return type stays the same.
export async function getReports(
  propertyId: string,
  { from, to, roomType }: Pick<ReportFilters, "from" | "to" | "roomType">,
): Promise<ReportsData> {
  void propertyId;
  const selected = ROOM_TYPES.filter((type) => type.id === roomType);
  const dates = datesBetween(from, to);
  return {
    reports: [...REPORT_KEYS],
    roomTypes: ROOM_TYPES.map(({ id, name }) => ({ id, name })),
    occupancy: dates.length === 0 ? null : occupancyFor(selected.length > 0 ? selected : ROOM_TYPES, dates),
  };
}
