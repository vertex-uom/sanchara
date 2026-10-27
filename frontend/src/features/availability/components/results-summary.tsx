"use client";

import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { countUnits, formatStayRange, RESTRICTION_LABELS, UNIT_FILTERS, type UnitFilter } from "../results";
import { RESTRICTION_BANNER } from "../status-tokens";
import type { AvailabilityResult } from "../types";

type ResultsSummaryProps = {
  result: AvailabilityResult | null;
  searching: boolean;
  filter: UnitFilter;
  onFilterChange: (filter: UnitFilter) => void;
  // The unit groups, rendered under the summary.
  children?: ReactNode;
};

// Results card: "x of y units available" with filter chips, or a
// restriction banner when the stay breaks a property rule.
export function ResultsSummary({ result, searching, filter, onFilterChange, children }: ResultsSummaryProps) {
  const violation = result?.restrictionViolation;
  const counts = countUnits(result?.units ?? []);

  let summary = "Checking availability…";
  if (result && !violation) {
    const range = formatStayRange(result.params.arrival, result.params.departure);
    summary = `${counts.available} of ${counts.all} ${counts.all === 1 ? "unit" : "units"} available for ${range}`;
  } else if (violation) {
    summary = `${RESTRICTION_LABELS[violation.rule]} rule not met`;
  }

  return (
    <section aria-labelledby="results-summary" aria-busy={searching || undefined} className="rounded-xl border border-border bg-card p-4 sm:p-5">
      {violation ? (
        <div role="alert" className={cn("flex gap-3 rounded-lg p-4", RESTRICTION_BANNER.container)}>
          <TriangleAlert aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", RESTRICTION_BANNER.icon)} />
          <div>
            <h2 id="results-summary" className={cn("font-semibold", RESTRICTION_BANNER.title)}>
              {RESTRICTION_LABELS[violation.rule]} rule not met
            </h2>
            <p className="mt-1 text-sm text-office-label">{violation.message}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="results-summary" aria-live="polite" className="text-lg font-bold text-foreground">
              {summary}
            </h2>
            {result ? (
              <div role="group" aria-label="Filter units" className="flex flex-wrap gap-2">
                {UNIT_FILTERS.map(({ key, label }) => {
                  const active = key === filter;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onFilterChange(key)}
                      className={cn(
                        "focus-ring inline-flex h-11 items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors motion-reduce:transition-none md:h-8",
                        active ? "bg-brand-tropical text-white" : "bg-office-chip text-foreground hover:bg-office-pill",
                      )}
                    >
                      {label} ({counts[key]})
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-office-muted">
            Units are shown after confirmed reservations, active holds and date blocks.
          </p>
          {children}
        </>
      )}
    </section>
  );
}
