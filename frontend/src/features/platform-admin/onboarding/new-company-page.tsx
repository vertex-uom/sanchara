import { Suspense } from "react";
import { AdminPageHeader } from "../components/page-header";
import { adminFetch } from "@/lib/auth/admin";
import { AdminSkeleton } from "../components/ui";
import type { OnboardingOptions } from "../types";
import { CreateCompanyWizard } from "./create-company-wizard";

// /onboarding/new: open a company, its first property and its Owner's
// account. Plans, property types, districts and subdomain rules come from the
// API so the form can't drift from what it accepts.
export function NewCompanyPage() {
  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader title="Create company" description="Open a company, add its first property and create the Owner's account. You get a single-use invite link for the Owner to set their password." />
      <Suspense fallback={<WizardSkeleton />}>
        <Wizard />
      </Suspense>
    </div>
  );
}

async function Wizard() {
  const options = await adminFetch<OnboardingOptions>("/v1/admin/onboarding/options");
  return <CreateCompanyWizard options={options} />;
}

function WizardSkeleton() {
  return (
    <div aria-busy="true" className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <span className="sr-only">Loading</span>
      <AdminSkeleton className="h-15 rounded-[14px] lg:h-60" />
      <AdminSkeleton className="h-115 rounded-[14px]" />
    </div>
  );
}
