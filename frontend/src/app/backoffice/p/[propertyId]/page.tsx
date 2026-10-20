import { Suspense } from "react";
import { getCurrentStaff } from "@/lib/auth/staff";
import { Skeleton, WidgetSkeleton } from "@/components/ui/widget";
import { RecentActivity } from "@/features/audit";
import { NeedsAttention, OverviewHeader } from "@/features/overview";
import { KPI_KEYS, KPI_PERIOD_PARAMS, KpiCards, parseKpiPeriod, type KpiPeriods } from "@/features/reports";
import { TodayAtAGlance } from "@/features/reservations";
import { SubscriptionCard } from "@/features/subscription";
import { WebsiteCard } from "@/features/website";

export const metadata = { title: "Overview" };

type OverviewProps = Pick<PageProps<"/backoffice/p/[propertyId]">, "params" | "searchParams">;

// Property overview (Owner view). Role-based widgets come later from /me.
// <main> renders at once; the URL-dependent content streams in.
export default function Page({ params, searchParams }: PageProps<"/backoffice/p/[propertyId]">) {
  return (
    <main id="main-content" tabIndex={-1} className="flex flex-col gap-5 px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-6">
      <Suspense fallback={<OverviewSkeleton />}>
        <Overview params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Overview({ params, searchParams }: OverviewProps) {
  const [{ propertyId }, query, user] = await Promise.all([params, searchParams, getCurrentStaff()]);
  const periods = Object.fromEntries(
    KPI_KEYS.map((key) => [key, parseKpiPeriod(query[KPI_PERIOD_PARAMS[key]])]),
  ) as KpiPeriods;

  return (
    <>
      <OverviewHeader firstName={user.firstName} />
      <KpiCards propertyId={propertyId} periods={periods} />
      <TodayAtAGlance propertyId={propertyId} />
      <div className="grid gap-5 xl:grid-cols-2">
        <NeedsAttention propertyId={propertyId} />
        <RecentActivity propertyId={propertyId} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <SubscriptionCard />
        <WebsiteCard />
      </div>
    </>
  );
}

// Mirrors the overview layout so the page doesn't jump when content arrives.
function OverviewSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">Loading overview</span>
      <div>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-2 h-6 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_KEYS.map((key) => (
          <Skeleton key={key} className="h-40 rounded-2xl" />
        ))}
      </div>
      <WidgetSkeleton title="Today at a glance" />
      <div className="grid gap-5 xl:grid-cols-2">
        <WidgetSkeleton title="Needs attention" />
        <WidgetSkeleton title="Recent activity" />
      </div>
    </div>
  );
}
