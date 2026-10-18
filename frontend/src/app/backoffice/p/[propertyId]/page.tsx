import { getCurrentStaff } from "@/lib/auth/staff";
import { RecentActivity } from "@/features/audit";
import { NeedsAttention, OverviewHeader } from "@/features/overview";
import { KPI_KEYS, KPI_PERIOD_PARAMS, KpiCards, parseKpiPeriod, type KpiPeriods } from "@/features/reports";
import { TodayAtAGlance } from "@/features/reservations";
import { SubscriptionCard } from "@/features/subscription";
import { WebsiteCard } from "@/features/website";

export const metadata = { title: "Overview" };

// Property overview (Owner view). Role-based widgets come later from /me.
export default async function Page({ params, searchParams }: PageProps<"/backoffice/p/[propertyId]">) {
  const [{ propertyId }, query, user] = await Promise.all([params, searchParams, getCurrentStaff()]);
  const periods = Object.fromEntries(
    KPI_KEYS.map((key) => [key, parseKpiPeriod(query[KPI_PERIOD_PARAMS[key]])]),
  ) as KpiPeriods;

  return (
    <main id="main-content" tabIndex={-1} className="flex flex-col gap-5 px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-6">
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
    </main>
  );
}
