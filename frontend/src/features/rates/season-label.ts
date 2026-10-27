const month = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
const dayMonth = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

function lastDayOfMonth(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate() === date.getUTCDate();
}

// Whole months read "Apr – Jun" (as in the design); other ranges "15 Apr – 10 Jun".
export function seasonRange(from: string, to: string) {
  if (from.endsWith("-01") && lastDayOfMonth(to)) {
    return month(from) === month(to) && from.slice(0, 7) === to.slice(0, 7) ? month(from) : `${month(from)} – ${month(to)}`;
  }
  return `${dayMonth(from)} – ${dayMonth(to)}`;
}
