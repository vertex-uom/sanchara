// Money arrives from the API in minor units with its ISO 4217 currency.
// The frontend formats it only; it never converts or recalculates amounts.
export type Money = { amountMinor: number; currency: string };

const LOCALE = "en-LK";

function minorDigits(currency: string) {
  return new Intl.NumberFormat(LOCALE, { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
}

// "LKR 24,500" for whole amounts, "LKR 24,500.50" otherwise.
export function formatMoney({ amountMinor, currency }: Money) {
  const digits = minorDigits(currency);
  const scale = 10 ** digits;
  const fractionDigits = amountMinor % scale === 0 ? 0 : digits;
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amountMinor / scale);
}
