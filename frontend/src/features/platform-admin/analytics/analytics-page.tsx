import { Suspense } from "react";
import { PageHeader } from "../components/page-header";
import { AdminSkeleton } from "../components/ui";
import { adminNavItem } from "../nav";
import { PLANS } from "../server/finance";
import { Cohorts } from "./cohorts";
import { FiltersBar } from "./filters-bar";
import { Funnel } from "./funnel";
import { KpiRow } from "./kpi-row";
import { PlansTable } from "./plans-table";
import { parseFilters, type SearchParams } from "./search-params";
import { TrendChart } from "./trend-chart";

type Props = { searchParams: Promise<SearchParams> };

// Analytics: how the platform itself is growing — companies, onboarding,
// subscriptions and retention. The design's marketplace metrics (bookings,
// GMV, take rate, occupancy, chargebacks, reviews, regions) either come from
// data Platform Admin must never read or do not exist in a flat-subscription
// model, so they are intentionally absent. Filters live in the URL.
export function AnalyticsPage({ searchParams }: Props) {
  const item = adminNavItem("analytics");
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={item.pageTitle ?? item.label} description={item.description} />
      <Suspense fallback={<WorkspaceSkeleton />}>
        <Workspace searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Workspace({ searchParams }: Props) {
  const filters = parseFilters(await searchParams);
  return (
    <>
      <FiltersBar filters={filters} plans={PLANS} />
      <KpiRow filters={filters} />
      <TrendChart filters={filters} />
      {/* The plan table has six columns, so it gets the wider track. */}
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Funnel filters={filters} />
        <PlansTable />
      </div>
      <Cohorts filters={filters} />
    </>
  );
}

function WorkspaceSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">Loading analytics</span>
      <AdminSkeleton className="h-[86px] rounded-[14px]" />
      <AdminSkeleton className="h-[150px] rounded-[14px]" />
      <AdminSkeleton className="h-[330px] rounded-[14px]" />
    </div>
  );
}
