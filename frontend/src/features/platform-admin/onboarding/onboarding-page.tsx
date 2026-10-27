import { Suspense } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../components/page-header";
import { AdminButtonLink, AdminSkeleton } from "../components/ui";
import { adminNavItem } from "../nav";
import { AwaitingTable } from "./awaiting-table";
import { OnboardingKpis } from "./onboarding-kpis";
import { newCompanyHref, parsePage, type SearchParams } from "./search-params";

type Props = { searchParams: Promise<SearchParams> };

// Onboarding & Verification. Companies are opened by the platform team (see
// /onboarding/new); this page tracks the ones whose Owner has not signed in
// yet. The design's self-service application review (document verification,
// approve/reject, re-verification) is not part of the product: owners do not
// apply online.
export function OnboardingPage({ searchParams }: Props) {
  const item = adminNavItem("onboarding");
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={item.pageTitle ?? item.label}
        description={item.description}
        actions={
          <AdminButtonLink href={newCompanyHref()} icon={Plus} variant="primary">
            Create company
          </AdminButtonLink>
        }
      />
      <OnboardingKpis />
      <Suspense fallback={<AdminSkeleton className="h-[520px] rounded-[14px]" />}>
        <List searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function List({ searchParams }: Props) {
  const page = parsePage(await searchParams);
  return <AwaitingTable page={page} />;
}
