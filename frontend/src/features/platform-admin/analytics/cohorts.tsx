import { Suspense } from "react";
import { Grid3x3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCount, formatPercent } from "@/lib/format/numbers";
import { AdminTable, TABLE_CELL, TABLE_HEAD_CELL, TABLE_ROW } from "../components/table";
import { AdminCard, AdminCardHeader, AdminSkeleton } from "../components/ui";
import { getRetentionCohorts } from "../server/analytics";
import type { AnalyticsFilters } from "../types";

// Six signup months × M0–M5: share of each cohort still paying at the end of
// each month since joining. Darker cells mean better retention.
export function Cohorts({ filters }: { filters: AnalyticsFilters }) {
  return (
    <AdminCard aria-labelledby="analytics-cohorts-heading">
      <AdminCardHeader id="analytics-cohorts-heading" icon={Grid3x3} title="Retention by signup month" />
      <Suspense fallback={<AdminSkeleton className="h-[260px] rounded-[10px]" />}>
        <CohortGrid filters={filters} />
      </Suspense>
      <p className="mt-3 text-[11px] text-admin-muted-text">Share of each month&apos;s new companies (setup completed) still paying at month end. Blocked for non-payment counts as lost; a recovered company counts again.</p>
    </AdminCard>
  );
}

function cellTone(value: number) {
  if (value >= 0.95) return "bg-admin-primary text-white";
  if (value >= 0.85) return "bg-admin-primary/70 text-white";
  if (value >= 0.7) return "bg-admin-primary/40 text-admin-heading";
  return "bg-admin-primary/15 text-admin-heading";
}

async function CohortGrid({ filters }: { filters: AnalyticsFilters }) {
  const cohorts = await getRetentionCohorts(filters);
  const months = cohorts[0]?.retention.length ?? 0;
  return (
    <AdminTable minWidth={520} aria-label="Retention by signup month">
      <thead>
        <tr className="bg-admin-muted">
          <th scope="col" className={TABLE_HEAD_CELL}>
            Signup month
          </th>
          <th scope="col" className={`${TABLE_HEAD_CELL} text-right`}>
            Companies
          </th>
          {Array.from({ length: months }, (_, k) => (
            <th key={k} scope="col" className={`${TABLE_HEAD_CELL} text-center`}>
              M{k}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {cohorts.map((cohort) => (
          <tr key={cohort.month} className={TABLE_ROW}>
            <th scope="row" className={`${TABLE_CELL} text-left whitespace-nowrap`}>
              {cohort.label}
            </th>
            <td className={`${TABLE_CELL} text-right tabular-nums`}>{formatCount(cohort.size)}</td>
            {cohort.retention.map((value, k) => (
              <td key={k} className="border-b border-admin-border p-1 text-center">
                {value === null ? (
                  <span className="text-[12px] text-admin-muted-text">
                    <span aria-hidden="true">—</span>
                    <span className="sr-only">{cohort.size === 0 ? "No companies" : "Not yet"}</span>
                  </span>
                ) : (
                  <span className={cn("block rounded-md py-2 text-[12px] font-medium tabular-nums", cellTone(value))}>{formatPercent(value, 0)}</span>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </AdminTable>
  );
}
