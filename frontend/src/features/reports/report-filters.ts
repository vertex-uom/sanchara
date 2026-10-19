import { isoDate, isValidDateRange, monthRange } from "@/lib/format/dates";
import { single, type SearchParams } from "@/lib/routes/search-params";
import { ALL_ROOM_TYPES, DEFAULT_REPORT, REPORT_KEYS, type ReportKey } from "./config";

// Reports page filters live in the URL: ?tab, ?range, ?from, ?to, ?roomType.
// Dates are date-only "YYYY-MM-DD" strings in Asia/Colombo, both ends inclusive.

export const REPORT_RANGES = [
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "this-quarter", label: "This quarter" },
  { value: "custom", label: "Custom" },
] as const;

export type ReportRange = (typeof REPORT_RANGES)[number]["value"];

export type PresetRange = Exclude<ReportRange, "custom">;

const PRESET_RANGES: PresetRange[] = ["this-month", "last-month", "this-quarter"];

const DEFAULT_RANGE: PresetRange = "this-month";

export type ReportFilters = {
  tab: ReportKey;
  range: ReportRange;
  from: string;
  to: string;
  roomType: string;
};

const MAX_RANGE_DAYS = 366;
const ROOM_TYPE_ID = /^[a-z0-9-]{1,64}$/;

export function presetRange(range: PresetRange, today: string): { from: string; to: string } {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7)) - 1;
  switch (range) {
    case "this-month":
      return monthRange(today);
    case "last-month":
      return { from: isoDate(year, month - 1, 1), to: isoDate(year, month, 0) };
    case "this-quarter": {
      // TODO(confirm): v8 has not defined "This quarter"; the calendar quarter is a temporary default.
      const start = month - (month % 3);
      return { from: isoDate(year, start, 1), to: isoDate(year, start + 3, 0) };
    }
  }
}

// Whitelists the URL; anything invalid falls back to the defaults.
// Valid from/to win over ?range and count as the preset with the same dates.
export function parseReportFilters(query: SearchParams, today: string): ReportFilters {
  const tab = REPORT_KEYS.find((key) => key === single(query.tab)) ?? DEFAULT_REPORT;
  const roomTypeParam = single(query.roomType);
  const roomType = roomTypeParam && ROOM_TYPE_ID.test(roomTypeParam) ? roomTypeParam : ALL_ROOM_TYPES;

  const from = single(query.from);
  const to = single(query.to);
  if (from && to && isValidDateRange(from, to, MAX_RANGE_DAYS)) {
    const preset = PRESET_RANGES.find((range) => {
      const dates = presetRange(range, today);
      return dates.from === from && dates.to === to;
    });
    return { tab, range: preset ?? "custom", from, to, roomType };
  }

  const range = PRESET_RANGES.find((preset) => preset === single(query.range)) ?? DEFAULT_RANGE;
  return { tab, range, ...presetRange(range, today), roomType };
}

// Link to the reports page with one filter changed; defaults are left out of the URL.
export function reportHref(path: string, filters: ReportFilters, change: { tab?: ReportKey; range?: PresetRange } = {}) {
  const tab = change.tab ?? filters.tab;
  const range = change.range ?? filters.range;
  const params = new URLSearchParams();
  if (tab !== DEFAULT_REPORT) params.set("tab", tab);
  if (range === "custom") {
    params.set("from", filters.from);
    params.set("to", filters.to);
  } else if (range !== DEFAULT_RANGE) {
    params.set("range", range);
  }
  if (filters.roomType !== ALL_ROOM_TYPES) params.set("roomType", filters.roomType);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
