import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { can } from "@/lib/auth/permissions";
import { getCurrentStaff } from "@/lib/auth/staff";
import { colomboToday } from "@/lib/format/dates";
import { propertyPath } from "@/lib/routes/backoffice";
import { EmptyState } from "@/components/ui/widget";
import { getCompanyProperties } from "@/features/properties";
import { getReports, OccupancyTab, parseReportFilters, ReportsHeader, ReportsSkeleton, ReportTabs } from "@/features/reports";

export const metadata = { title: "Reports" };

type ReportsProps = Pick<PageProps<"/backoffice/p/[propertyId]/reports">, "params" | "searchParams">;

// Property reports (Owner and Manager). Filters live in the URL; only the
// Occupancy report has a design so far.
export default function Page({ params, searchParams }: PageProps<"/backoffice/p/[propertyId]/reports">) {
  return (
    <main id="main-content" tabIndex={-1} className="flex flex-col gap-4 px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-6">
      <Suspense fallback={<ReportsSkeleton />}>
        <Reports params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Reports({ params, searchParams }: ReportsProps) {
  const [{ propertyId }, query, user] = await Promise.all([params, searchParams, getCurrentStaff(), connection()]);
  if (!can(user, "reports.read")) redirect("/forbidden");

  const filters = parseReportFilters(query, colomboToday(new Date()));
  const [data, properties] = await Promise.all([getReports(propertyId, filters), getCompanyProperties()]);
  const property = properties.find((item) => item.id === propertyId);
  if (!property) notFound();

  // Tabs come from the data (plan entitlements), not a fixed list.
  const tab = data.reports.includes(filters.tab) ? filters.tab : data.reports[0];
  const path = propertyPath(propertyId, "reports");

  return (
    <>
      <ReportsHeader propertyName={property.name} location={`${property.town}, ${property.country}`} />
      {tab ? (
        <>
          <ReportTabs path={path} filters={filters} reports={data.reports} active={tab} />
          {tab === "occupancy" ? (
            <OccupancyTab path={path} filters={filters} data={data} />
          ) : (
            <EmptyState>Coming soon</EmptyState>
          )}
        </>
      ) : (
        <EmptyState>No reports are available for this property.</EmptyState>
      )}
    </>
  );
}
