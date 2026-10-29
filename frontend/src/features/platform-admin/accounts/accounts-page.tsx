import { Suspense } from "react";
import { Download } from "lucide-react";
import { parsePage, type SearchParams } from "@/lib/routes/search-params";
import { AdminPageHeader } from "../components/page-header";
import { AdminSubTabs } from "../components/sub-tabs";
import { AdminButton, AdminSkeleton } from "../components/ui";
import { adminNavItem } from "../nav";
import { getCompanyFilterOptions, listCompanies, listEnforcementLog } from "../server/accounts";
import { countOpenWebsiteRequests } from "../server/website-requests";
import { AccountKpis } from "./account-kpis";
import { CompaniesTable } from "./companies-table";
import { CompanyDetail, DetailPlaceholder } from "./company-detail";
import { EnforcementLog } from "./enforcement-log";
import { FiltersBar } from "./filters-bar";
import { companiesHref, enforcementHref, parseFilters, parseTab, parseWebsiteRequestFilters, websiteRequestsHref, type AccountsTab } from "./search-params";
import { WebsiteRequestDetail } from "./website-request-detail";
import { WebsiteRequestsList } from "./website-requests";

type Props = {
  searchParams: Promise<SearchParams>;
  // /accounts/[companyId] opens a company in the detail panel (beside the
  // list from xl, on its own below); /accounts/website-requests/[requestId]
  // opens a website request on the Website requests tab.
  params?: Promise<{ companyId?: string; requestId?: string }>;
};

// Accounts & Enforcement: the company directory with suspend / reactivate,
// the platform-wide enforcement log, and Owners' website requests. The list
// state (tab, filters, page) lives in the URL. Everything that reads the URL
// renders inside one Suspense boundary so the page header streams first.
export function AccountsPage({ searchParams, params }: Props) {
  const item = adminNavItem("accounts");
  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title={item.pageTitle ?? item.label}
        description={item.description}
        actions={
          // TODO(accounts): export the filtered company list as CSV.
          <AdminButton icon={Download} placeholder>
            Export
          </AdminButton>
        }
      />
      <Suspense fallback={<WorkspaceSkeleton />}>
        <Workspace searchParams={searchParams} params={params} />
      </Suspense>
    </div>
  );
}

async function Workspace({ searchParams, params }: Props) {
  const [query, route] = await Promise.all([searchParams, params]);
  const selectedId = route?.companyId;
  const requestId = route?.requestId;
  const filters = parseFilters(query);
  // Detail routes always belong to their own tab.
  const tab: AccountsTab = selectedId ? "companies" : requestId ? "websites" : parseTab(query);

  if (requestId) {
    return (
      <>
        <SubTabs active={tab} />
        <WebsiteRequestDetail id={requestId} />
      </>
    );
  }

  if (tab === "websites") {
    return (
      <>
        <SubTabs active={tab} />
        <WebsiteRequestsList filters={parseWebsiteRequestFilters(query)} />
      </>
    );
  }

  if (tab === "enforcement") {
    return (
      <>
        <SubTabs active={tab} />
        <EnforcementLog page={parsePage(query)} />
      </>
    );
  }

  const options = await getCompanyFilterOptions();
  return (
    <>
      <SubTabs active={tab} />
      {/* Below xl an open company takes the whole screen: metrics and filters step aside. */}
      <div className={selectedId ? "hidden xl:contents" : "contents"}>
        <AccountKpis />
        <FiltersBar filters={filters} options={options} />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 xl:grid-cols-[minmax(0,704fr)_minmax(0,400fr)]">
        <CompaniesTable filters={filters} selectedId={selectedId} className={selectedId ? "hidden xl:block" : undefined} />
        {selectedId ? <CompanyDetail id={selectedId} filters={filters} /> : <DetailPlaceholder className="hidden xl:flex" />}
      </div>
    </>
  );
}

async function SubTabs({ active }: { active: AccountsTab }) {
  const [companies, log, requests] = await Promise.all([listCompanies({ q: "", status: "all", plan: "", region: "", period: "all", sort: "newest", page: 1 }), listEnforcementLog(), countOpenWebsiteRequests()]);
  return (
    <AdminSubTabs
      label="Accounts sections"
      active={active}
      tabs={[
        { key: "companies", label: "Companies", count: companies.total, href: companiesHref() },
        { key: "enforcement", label: "Enforcement log", count: log.length, href: enforcementHref() },
        { key: "websites", label: "Website requests", count: requests.total, href: websiteRequestsHref() },
      ]}
    />
  );
}

function WorkspaceSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">Loading companies</span>
      <AdminSkeleton className="h-8.5 w-80 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <AdminSkeleton key={i} className="h-37.5 rounded-[14px]" />
        ))}
      </div>
      <AdminSkeleton className="h-22 rounded-[14px]" />
      <AdminSkeleton className="h-130 rounded-[14px]" />
    </div>
  );
}
