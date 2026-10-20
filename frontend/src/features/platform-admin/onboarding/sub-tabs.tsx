import { AdminSubTabs } from "../components/sub-tabs";
import { listApplications } from "../server/onboarding";
import type { ApplicationFilters } from "../types";
import { applicationsHref, type OnboardingTab } from "./search-params";

export async function SubTabs({ active, filters }: { active: OnboardingTab; filters: ApplicationFilters }) {
  const open = await listApplications({ ...filters, status: "open", q: "", region: "", type: "", period: "all", page: 1 });
  return (
    <AdminSubTabs
      label="Onboarding sections"
      active={active}
      tabs={[
        { key: "applications", label: "Owner Applications", count: open.total, href: applicationsHref(filters) },
        { key: "re-verification", label: "Re-verification", href: applicationsHref({}, "re-verification") },
      ]}
    />
  );
}
