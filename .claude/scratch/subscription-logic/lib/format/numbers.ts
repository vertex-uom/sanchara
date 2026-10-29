const LOCALE = "en-LK";

// ratio 0.68 → "68%". Ratios come from the API; the frontend does not derive them.
export function formatPercent(ratio: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat(LOCALE, { style: "percent", maximumFractionDigits }).format(ratio);
}

// ratio 0.12 → "+12%", -0.05 → "−5%", 0 → "0%".
export function formatSignedPercent(ratio: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat(LOCALE, { style: "percent", maximumFractionDigits, signDisplay: "exceptZero" }).format(ratio);
}

// Share of a limit in use, 0–1, for drawing a bar. No limit (null or 0) draws nothing.
export function usageRatio(used: number, limit: number | null) {
  return limit && limit > 0 ? Math.min(Math.max(used / limit, 0), 1) : 0;
}

export function formatCount(value: number) {
  return new Intl.NumberFormat(LOCALE).format(value);
}
