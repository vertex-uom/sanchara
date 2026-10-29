// Back Office dates and times are shown in Sri Lanka time (no DST).
export const BACKOFFICE_TIME_ZONE = "Asia/Colombo";

const LOCALE = "en-GB";
const DAY_MS = 24 * 60 * 60 * 1000;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// "2026-10-18": the Colombo calendar date of an instant (today: pass new Date()).
export function colomboDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BACKOFFICE_TIME_ZONE }).format(date);
}

// Date-only "YYYY-MM-DD" from parts. Day 0 and out-of-range months roll
// over, so (2026, 10, 0) is "2026-10-31".
export function isoDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10);
}

// True for a real calendar date in "YYYY-MM-DD" form (rejects 2026-02-30).
export function isIsoDate(value: string) {
  const time = Date.parse(`${value}T00:00:00Z`);
  return DATE_ONLY.test(value) && !Number.isNaN(time) && new Date(time).toISOString().startsWith(value);
}

// Two real dates with from ≤ to, spanning at most maxDays (both ends inclusive).
export function isValidDateRange(from: string, to: string, maxDays: number) {
  if (!isIsoDate(from) || !isIsoDate(to)) return false;
  const days = (Date.parse(to) - Date.parse(from)) / DAY_MS + 1;
  return days >= 1 && days <= maxDays;
}

// First and last day of the month that contains a date-only value.
export function monthRange(isoDay: string) {
  const year = Number(isoDay.slice(0, 4));
  const month = Number(isoDay.slice(5, 7)) - 1;
  return { from: isoDate(year, month, 1), to: isoDate(year, month + 1, 0) };
}

// "18 Oct 2026"
export function formatDate(date: Date) {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: BACKOFFICE_TIME_ZONE,
  }).format(date);
}

// Date-only API values ("2026-11-01") → "01 Nov 2026", with no time-zone shift.
export function formatDateOnly(isoDate: string) {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

// Date-only API values ("2026-10-01") → "1 Oct" (chart axis labels).
export function formatDayMonth(isoDate: string) {
  return new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );
}

export function colomboHour(date: Date) {
  return Number(
    new Intl.DateTimeFormat(LOCALE, { hour: "numeric", hourCycle: "h23", timeZone: BACKOFFICE_TIME_ZONE }).format(date),
  );
}

// "10:24 AM"
function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", timeZone: BACKOFFICE_TIME_ZONE }).format(date);
}

// { date: "06 Oct 2026", time: "11:35 AM" } for an instant, in Colombo.
export function formatDateTimeParts(iso: string) {
  const date = new Date(iso);
  return {
    date: new Intl.DateTimeFormat(LOCALE, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: BACKOFFICE_TIME_ZONE,
    }).format(date),
    time: formatTime(date),
  };
}

// "Today, 10:24 AM", "Yesterday, 06:42 PM" or "16 Oct, 03:00 PM".
export function formatRelativeDateTime(iso: string, now: Date) {
  const date = new Date(iso);
  const time = formatTime(date);
  const key = colomboDateKey(date);
  if (key === colomboDateKey(now)) return `Today, ${time}`;
  if (key === colomboDateKey(new Date(now.getTime() - DAY_MS))) return `Yesterday, ${time}`;
  const day = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", timeZone: BACKOFFICE_TIME_ZONE }).format(date);
  return `${day}, ${time}`;
}
