import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { AdminSkeleton } from "../components/ui";
import { adminNavItem } from "../nav";
import { getApplicationFilterOptions } from "../server/onboarding";
import { ApplicationDetail, DetailPlaceholder } from "./application-detail";
import { ApplicationKpis } from "./application-kpis";
import { ApplicationsTable } from "./applications-table";
import { FiltersBar } from "./filters-bar";
import { HeaderActions } from "./header-actions";
import { ReVerificationPlaceholder } from "./re-verification";
import { parseFilters, parseTab, type SearchParams } from "./search-params";
import { SubTabs } from "./sub-tabs";

type Props = {
  searchParams: Promise<SearchParams>;
  // Set by the /onboarding/[applicationId] route; opens the detail panel
  // (beside the list from xl, on its own below).
  params?: Promise<{ applicationId: string }>;
};

// Onboarding & Verification. The list state (tab, filters, page) lives in the
// URL. Everything that reads the URL renders inside one Suspense boundary so
// the page header streams first.
export function OnboardingPage({ searchParams, params }: Props) {
  const item = adminNavItem("onboarding");
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={item.pageTitle ?? item.label} description={item.description} actions={<HeaderActions />} />
      <Suspense fallback={<WorkspaceSkeleton />}>
        <Workspace searchParams={searchParams} params={params} />
      </Suspense>
    </div>
  );
}

async function Workspace({ searchParams, params }: Props) {
  const [query, route] = await Promise.all([searchParams, params]);
  const selectedId = route?.applicationId;
  const filters = parseFilters(query);
  // The detail route always belongs to the applications tab.
  const tab = selectedId ? "applications" : parseTab(query);

  if (tab === "re-verification") {
    return (
      <>
        <SubTabs active={tab} filters={filters} />
        <ReVerificationPlaceholder />
      </>
    );
  }

  const options = await getApplicationFilterOptions();
  return (
    <>
      <SubTabs active={tab} filters={filters} />
      {/* Below xl an open application takes the whole screen: metrics and filters step aside. */}
      <div className={selectedId ? "hidden xl:contents" : "contents"}>
        <ApplicationKpis />
        <FiltersBar filters={filters} options={options} />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 xl:grid-cols-[minmax(0,704fr)_minmax(0,400fr)]">
        <ApplicationsTable filters={filters} selectedId={selectedId} className={selectedId ? "hidden xl:block" : undefined} />
        {selectedId ? <ApplicationDetail id={selectedId} filters={filters} /> : <DetailPlaceholder className="hidden xl:flex" />}
      </div>
    </>
  );
}

function WorkspaceSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">Loading applications</span>
      <AdminSkeleton className="h-[34px] w-80 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <AdminSkeleton key={i} className="h-[150px] rounded-[14px]" />
        ))}
      </div>
      <AdminSkeleton className="h-[88px] rounded-[14px]" />
      <AdminSkeleton className="h-[520px] rounded-[14px]" />
    </div>
  );
}
