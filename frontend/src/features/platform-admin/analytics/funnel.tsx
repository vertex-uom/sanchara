import { Suspense } from "react";
import { Filter } from "lucide-react";
import { formatCount, formatPercent } from "@/lib/format/numbers";
import { AdminCard, AdminCardHeader, AdminChip, AdminSkeleton } from "../components/ui";
import { getOnboardingFunnel } from "../server/analytics";
import type { AnalyticsFilters } from "../types";
import { PERIOD_LABELS } from "./search-params";

// Companies created → Owner signed in → Setup completed → First renewal paid,
// for companies created in the selected period. The biggest drop is called out.
export function Funnel({ filters }: { filters: AnalyticsFilters }) {
  return (
    <AdminCard aria-labelledby="analytics-funnel-heading">
      <AdminCardHeader id="analytics-funnel-heading" icon={Filter} title="Onboarding funnel" chip={<AdminChip tone="neutral">{PERIOD_LABELS[filters.period]}</AdminChip>} />
      <Suspense fallback={<AdminSkeleton className="h-[220px] rounded-[10px]" />}>
        <FunnelSteps filters={filters} />
      </Suspense>
    </AdminCard>
  );
}

async function FunnelSteps({ filters }: { filters: AnalyticsFilters }) {
  const steps = await getOnboardingFunnel(filters);
  const top = steps[0].count;
  const biggestDrop = steps.slice(1).reduce<(typeof steps)[number] | null>((worst, step) => (step.rate !== null && (worst === null || worst.rate === null || step.rate < worst.rate) ? step : worst), null);
  if (top === 0) return <p className="py-10 text-center text-[12.5px] text-admin-muted-text">No companies were created in this period.</p>;

  return (
    <>
      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => {
          const width = top ? Math.max((step.count / top) * 100, 2) : 0;
          const isDrop = biggestDrop !== null && step.key === biggestDrop.key;
          return (
            <li key={step.key} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5">
              <p className="text-[12.5px] text-admin-body">
                <span className="mr-1.5 text-admin-muted-text">{i + 1}.</span>
                {step.label}
              </p>
              <p className="text-right text-[12.5px] font-semibold text-admin-heading tabular-nums">
                {formatCount(step.count)}
                {step.rate !== null ? <span className={isDrop ? "ml-2 font-medium text-admin-warning" : "ml-2 font-normal text-admin-muted-text"}>{formatPercent(step.rate, 0)}</span> : null}
              </p>
              <div className="col-span-2 h-2 rounded-full bg-admin-muted" role="presentation">
                <div className={isDrop ? "h-full rounded-full bg-admin-warning" : "h-full rounded-full bg-admin-primary"} style={{ width: `${width}%` }} />
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-[11px] text-admin-muted-text">
        {biggestDrop && biggestDrop.rate !== null ? (
          <>
            Biggest drop: <span className="font-medium text-admin-body">{biggestDrop.label.toLowerCase()}</span> — {formatPercent(1 - biggestDrop.rate, 0)} of the previous step did not get there.
          </>
        ) : (
          "Percentages are relative to the previous step."
        )}
      </p>
    </>
  );
}
