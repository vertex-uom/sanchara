import { formatMoney } from "@/lib/format/money";
import { formatCount, formatPercent } from "@/lib/format/numbers";
import { cn } from "@/lib/utils";
import type { KpiValue } from "../types";

// KPI figure shared by the Overview and Reports cards. Several currencies stack.
export function KpiValueText({ value }: { value: KpiValue }) {
  const className = "text-2xl font-semibold tracking-tight sm:text-3xl";
  if (value.kind === "ratio") return <p className={className}>{formatPercent(value.ratio)}</p>;
  if (value.kind === "count") return <p className={className}>{formatCount(value.count)}</p>;
  if (value.amounts.length === 0) return <p className={className}>–</p>;
  return (
    <p className={cn(className, value.amounts.length > 1 && "text-xl sm:text-2xl")}>
      {value.amounts.map((amount, index) => (
        <span key={amount.currency} className="block">
          {index > 0 ? <span className="sr-only">and </span> : null}
          {formatMoney(amount)}
        </span>
      ))}
    </p>
  );
}
