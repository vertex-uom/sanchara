// Back Office dates and times are shown in Sri Lanka time (no DST).
export const BACKOFFICE_TIME_ZONE = "Asia/Colombo";

const LOCALE = "en-GB";
const DAY_MS = 24 * 60 * 60 * 1000;

// "2026-10-18" for the given instant, in Colombo.
function dayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BACKOFFICE_TIME_ZONE }).format(date);
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

export function colomboHour(date: Date) {
  return Number(
    new Intl.DateTimeFormat(LOCALE, { hour: "numeric", hourCycle: "h23", timeZone: BACKOFFICE_TIME_ZONE }).format(date),
  );
}

// "Today, 10:24 AM", "Yesterday, 06:42 PM" or "16 Oct, 03:00 PM".
export function formatRelativeDateTime(iso: string, now: Date) {
  const date = new Date(iso);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BACKOFFICE_TIME_ZONE,
  }).format(date);
  const key = dayKey(date);
  if (key === dayKey(now)) return `Today, ${time}`;
  if (key === dayKey(new Date(now.getTime() - DAY_MS))) return `Yesterday, ${time}`;
  const day = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", timeZone: BACKOFFICE_TIME_ZONE }).format(date);
  return `${day}, ${time}`;
}
