import { formatMoney, type Money } from "@/lib/format/money";
import { formatCount } from "@/lib/format/numbers";

// Values v8 has not decided arrive as null and read as "[… TBD]".

export function moneyText(value: Money | null, what: "Price" | "Amount") {
  return value ? formatMoney(value) : `[${what} TBD]`;
}

export function limitText(limit: number | null) {
  return limit === null ? "[Limit TBD]" : formatCount(limit);
}
