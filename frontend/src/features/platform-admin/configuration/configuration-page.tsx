import { Suspense } from "react";
import { parsePage, type SearchParams } from "@/lib/routes/search-params";
import { AdminPageHeader } from "../components/page-header";
import { AdminSubTabs } from "../components/sub-tabs";
import { AdminSkeleton } from "../components/ui";
import { adminNavItem } from "../nav";
import { getCustomDomainCounts, getPlans, listWebsiteTemplates } from "../server/configuration";
import { DomainsTab } from "./domains-tab";
import { PlansTab } from "./plans-tab";
import { configurationHref, parseTab, type ConfigurationTab } from "./search-params";
import { TemplatesTab } from "./templates-tab";

// Platform Configuration: what the platform team configures through its own
// modules: plans (subscriptions), hosts (domains) and website templates
// (website). Regions, currencies, master data, notification templates,
// feature flags and integrations from the design have no module behind them
// and are intentionally absent. The active tab lives in the URL.
export function ConfigurationPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const item = adminNavItem("configuration");
  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader title={item.pageTitle ?? item.label} description={item.description} />
      <Suspense fallback={<WorkspaceSkeleton />}>
        <Workspace searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Workspace({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const tab = parseTab(query);
  return (
    <>
      <SubTabs active={tab} />
      {tab === "plans" ? <PlansTab /> : tab === "domains" ? <DomainsTab page={parsePage(query)} /> : <TemplatesTab />}
    </>
  );
}

async function SubTabs({ active }: { active: ConfigurationTab }) {
  const [plans, domains, templates] = await Promise.all([getPlans(), getCustomDomainCounts(), listWebsiteTemplates()]);
  return (
    <AdminSubTabs
      label="Platform Configuration sections"
      active={active}
      tabs={[
        { key: "plans", label: "Plans", count: plans.length, href: configurationHref("plans") },
        { key: "domains", label: "Domains", count: domains.all, href: configurationHref("domains") },
        { key: "templates", label: "Website templates", count: templates.length, href: configurationHref("templates") },
      ]}
    />
  );
}

function WorkspaceSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">Loading configuration</span>
      <AdminSkeleton className="h-8.5 w-96 max-w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <AdminSkeleton key={i} className="h-80 rounded-[14px]" />
        ))}
      </div>
      <AdminSkeleton className="h-80 rounded-[14px]" />
    </div>
  );
}
