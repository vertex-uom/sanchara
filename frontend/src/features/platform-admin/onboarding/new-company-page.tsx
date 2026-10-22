import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { AdminSkeleton } from "../components/ui";
import { getDomainSettings, getPlans } from "../server/configuration";
import { PROPERTY_TYPES } from "../server/onboarding";
import { CreateCompanyWizard } from "./create-company-wizard";

// /onboarding/new: open a company and its Owner's login. Plans, reserved
// subdomains and hosts come from Platform Configuration so the form cannot
// drift from it.
export function NewCompanyPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Create company" description="Open a company, add its first property and create the Owner's login. The Owner receives the owner-portal link and a temporary password by email." />
      <Suspense fallback={<WizardSkeleton />}>
        <Wizard />
      </Suspense>
    </div>
  );
}

async function Wizard() {
  const [plans, domains] = await Promise.all([getPlans(), getDomainSettings()]);
  return <CreateCompanyWizard plans={plans} propertyTypes={PROPERTY_TYPES} reservedSubdomains={domains.reserved.map((r) => r.name)} platformDomain={domains.platformDomain} backOfficeHost={domains.backOfficeHost} />;
}

function WizardSkeleton() {
  return (
    <div aria-busy="true" className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <span className="sr-only">Loading</span>
      <AdminSkeleton className="h-[60px] rounded-[14px] lg:h-[240px]" />
      <AdminSkeleton className="h-[460px] rounded-[14px]" />
    </div>
  );
}
