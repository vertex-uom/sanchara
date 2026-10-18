"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { DEFAULT_KPI_PERIOD, KPI_PERIODS, type KpiPeriod } from "../config";

type KpiPeriodSelectProps = {
  id: string;
  kpiTitle: string;
  paramName: string;
  value: KpiPeriod;
  // Other cards' non-default periods, kept in the URL when this one changes.
  otherParams: Record<string, string>;
};

// Stores the card's period in the URL; the server re-renders that card.
export function KpiPeriodSelect({ id, kpiTitle, paramName, value, otherParams }: KpiPeriodSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleChange(next: string) {
    const params = new URLSearchParams(otherParams);
    if (next !== DEFAULT_KPI_PERIOD) params.set(paramName, next);
    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  return (
    <div className="relative shrink-0">
      <label htmlFor={id} className="sr-only">
        Period for {kpiTitle}
      </label>
      <select
        id={id}
        value={value}
        aria-busy={isPending}
        onChange={(event) => handleChange(event.target.value)}
        className="focus-ring h-11 cursor-pointer md:h-8 appearance-none rounded-md border border-border bg-card py-1 pr-7 pl-2 text-xs text-muted-foreground"
      >
        {KPI_PERIODS.map((period) => (
          <option key={period.value} value={period.value}>
            {period.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-office-icon" />
    </div>
  );
}
