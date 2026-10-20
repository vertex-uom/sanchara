import { Suspense } from "react";
import { Building2, Check, DoorOpen, UsersRound } from "lucide-react";
import { formatMoney } from "@/lib/format/money";
import { AdminCard, AdminChip, AdminSkeleton } from "../components/ui";
import { ICON_STROKE } from "../sidebar-modes";
import { getPlans } from "../server/configuration";
import { PlatformRules } from "./platform-rules";
import { formatLimit } from "./status";

// Plans tab: the three plans side by side, read-only (prices and limits are
// still open in the architecture), then the platform rules.
export function PlansTab() {
  return (
    <>
      <section aria-labelledby="plans-title">
        <h2 id="plans-title" className="sr-only">
          Plans
        </h2>
        <Suspense fallback={<PlansSkeleton />}>
          <PlanCards />
        </Suspense>
      </section>
      <PlatformRules />
    </>
  );
}

async function PlanCards() {
  const plans = await getPlans();
  return (
    <>
      <ul className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <li key={plan.id}>
            <AdminCard aria-labelledby={`plan-${plan.id}-title`} className="flex h-full flex-col gap-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 id={`plan-${plan.id}-title`} className="text-base font-semibold text-admin-heading">
                    {plan.name}
                  </h3>
                  <AdminChip tone="neutral">{plan.companies.toLocaleString("en-US")} companies</AdminChip>
                </div>
                <p className="mt-1 text-[11.5px] leading-snug text-admin-muted-text">{plan.tagline}</p>
              </div>
              <p className="flex items-baseline gap-1.5">
                <span className="text-[26px] leading-none font-semibold text-admin-heading tabular-nums">{formatMoney(plan.monthlyPrice)}</span>
                <span className="text-[11.5px] text-admin-muted-text">/ month</span>
              </p>
              <dl className="flex flex-col gap-2 text-[12.5px] font-medium text-admin-heading">
                <div className="flex items-center gap-2.5">
                  <Building2 aria-hidden="true" strokeWidth={ICON_STROKE} className="size-[18px] shrink-0 text-admin-icon" />
                  <dt className="sr-only">Properties</dt>
                  <dd>{formatLimit(plan.limits.properties, "properties")}</dd>
                </div>
                <div className="flex items-center gap-2.5">
                  <DoorOpen aria-hidden="true" strokeWidth={ICON_STROKE} className="size-[18px] shrink-0 text-admin-icon" />
                  <dt className="sr-only">Units</dt>
                  <dd>{formatLimit(plan.limits.units, "units")}</dd>
                </div>
                <div className="flex items-center gap-2.5">
                  <UsersRound aria-hidden="true" strokeWidth={ICON_STROKE} className="size-[18px] shrink-0 text-admin-icon" />
                  <dt className="sr-only">Staff accounts</dt>
                  <dd>{formatLimit(plan.limits.staffAccounts, "staff accounts")}</dd>
                </div>
              </dl>
              <div className="mt-auto border-t border-admin-border pt-3">
                <p className="mb-1.5 text-[11px] font-medium text-admin-muted-text">Reports included</p>
                <ul className="flex flex-col gap-1">
                  {plan.reports.map((report) => (
                    <li key={report} className="flex items-center gap-2 text-[12px] text-admin-body">
                      <Check aria-hidden="true" strokeWidth={ICON_STROKE} className="size-3.5 shrink-0 text-admin-success" />
                      {report}
                    </li>
                  ))}
                </ul>
              </div>
            </AdminCard>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11.5px] text-admin-muted-text">Prices, limits and the reports per plan are read from configuration. They are still open in the architecture; nothing here is hard-coded in the apps.</p>
    </>
  );
}

function PlansSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-4 md:grid-cols-3">
      <span className="sr-only">Loading plans</span>
      {Array.from({ length: 3 }, (_, i) => (
        <AdminSkeleton key={i} className="h-[320px] rounded-[14px]" />
      ))}
    </div>
  );
}
