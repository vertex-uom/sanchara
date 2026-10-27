import { Suspense } from "react";
import { type SearchParams } from "@/lib/routes/search-params";
import { AdminPageHeader } from "../components/page-header";
import { AdminSubTabs } from "../components/sub-tabs";
import { AdminSkeleton } from "../components/ui";
import { adminNavItem } from "../nav";
import { getSubscriptionCounts, PLANS } from "../server/finance";
import { ExchangeRateTab } from "./exchange-rate";
import { FiltersBar } from "./filters-bar";
import { exchangeRateHref, parseFilters, parseTab, subscriptionsHref, type FinanceTab } from "./search-params";
import { DetailPlaceholder, SubscriptionDetail } from "./subscription-detail";
import { SubscriptionsTable } from "./subscriptions-table";

type Props = {
  searchParams: Promise<SearchParams>;
  // Set by the /finance/[companyId] route; opens the detail panel (beside
  // the list from xl, on its own below).
  params?: Promise<{ companyId: string }>;
};

// Financial Operations: every company's subscription (plan, billing state,
// grace period, invoices) and the platform exchange rate. Nothing here reads
// guest payments, refunds or reservations. The list state (tab, filters,
// page) lives in the URL; everything that reads it renders inside one
// Suspense boundary so the page header streams first.
export function FinancePage({ searchParams, params }: Props) {
  const item = adminNavItem("finance");
  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader title={item.pageTitle ?? item.label} description={item.description} />
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
  // The detail route always belongs to the subscriptions tab.
  const tab: FinanceTab = selectedId ? "subscriptions" : parseTab(query);

  if (tab === "exchange-rate") {
    return (
      <>
        <SubTabs active={tab} />
        <ExchangeRateTab />
      </>
    );
  }

  return (
    <>
      <SubTabs active={tab} />
      {/* Below xl an open subscription takes the whole screen: filters step aside. */}
      <FiltersBar filters={filters} plans={PLANS} className={selectedId ? "hidden xl:flex" : undefined} />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 xl:grid-cols-[minmax(0,704fr)_minmax(0,400fr)]">
        <SubscriptionsTable filters={filters} selectedId={selectedId} className={selectedId ? "hidden xl:block" : undefined} />
        {selectedId ? <SubscriptionDetail id={selectedId} filters={filters} /> : <DetailPlaceholder className="hidden xl:flex" />}
      </div>
    </>
  );
}

async function SubTabs({ active }: { active: FinanceTab }) {
  const counts = await getSubscriptionCounts();
  return (
    <AdminSubTabs
      label="Financial Operations sections"
      active={active}
      tabs={[
        { key: "subscriptions", label: "Subscriptions", count: counts.all, href: subscriptionsHref() },
        { key: "exchange-rate", label: "Exchange rate", href: exchangeRateHref() },
      ]}
    />
  );
}

function WorkspaceSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">Loading subscriptions</span>
      <AdminSkeleton className="h-[34px] w-80 max-w-full" />
      <AdminSkeleton className="h-[88px] rounded-[14px]" />
      <AdminSkeleton className="h-[520px] rounded-[14px]" />
    </div>
  );
}
