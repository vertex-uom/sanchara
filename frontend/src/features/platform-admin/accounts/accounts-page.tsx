import { Suspense } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { AdminSubTabs } from "../components/sub-tabs";
import { AdminButton, AdminSkeleton } from "../components/ui";
import { adminNavItem } from "../nav";
import { getCompanyFilterOptions, listCompanies, listEnforcementLog } from "../server/accounts";
import { AccountKpis } from "./account-kpis";
import { CompaniesTable } from "./companies-table";
import { CompanyDetail, DetailPlaceholder } from "./company-detail";
import { EnforcementLog } from "./enforcement-log";
import { FiltersBar } from "./filters-bar";
import { companiesHref, enforcementHref, parseFilters, parsePage, parseTab, type AccountsTab, type SearchParams } from "./search-params";
import { WebsiteRequests } from "./website-requests";

type Props = {
  searchParams: Promise<SearchParams>;
  // Set by the /accounts/[companyId] route; opens the detail panel (beside
  // the list from xl, on its own below).
  params?: Promise<{ companyId: string }>;
};

// Accounts & Enforcement: the company directory with suspend / reactivate,
// open website requests, and the platform-wide enforcement log. The list
// state (tab, filters, page) lives in the URL. Everything that reads the URL
// renders inside one Suspense boundary so the page header streams first.
export function AccountsPage({ searchParams, params }: Props) {
  const item = adminNavItem("accounts");
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
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
  const filters = parseFilters(query);
  // The detail route always belongs to the companies tab.
  const tab: AccountsTab = selectedId ? "companies" : parseTab(query);

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
      <WebsiteRequests className={selectedId ? "hidden xl:block" : undefined} />
    </>
  );
}

async function SubTabs({ active }: { active: AccountsTab }) {
  const [companies, log] = await Promise.all([listCompanies({ q: "", status: "all", plan: "", region: "", period: "all", sort: "newest", page: 1 }), listEnforcementLog()]);
  return (
    <AdminSubTabs
      label="Accounts sections"
      active={active}
      tabs={[
        { key: "companies", label: "Companies", count: companies.total, href: companiesHref() },
        { key: "enforcement", label: "Enforcement log", count: log.length, href: enforcementHref() },
      ]}
    />
  );
}

function WorkspaceSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">Loading companies</span>
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
