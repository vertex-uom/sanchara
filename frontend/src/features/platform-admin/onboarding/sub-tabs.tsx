import Link from "next/link";
import { cn } from "@/lib/utils";
import { listApplications } from "../server/onboarding";
import type { ApplicationFilters } from "../types";
import { applicationsHref, type OnboardingTab } from "./search-params";

// Tab row from the design (34px pills; the active one is filled with the
// brand colour). Tabs are links so the active tab is part of the URL.
export async function SubTabs({ active, filters }: { active: OnboardingTab; filters: ApplicationFilters }) {
  const open = await listApplications({ ...filters, status: "open", q: "", region: "", type: "", period: "all", page: 1 });

  const tabs: { key: OnboardingTab; label: string; count?: number }[] = [
    { key: "applications", label: "Owner Applications", count: open.total },
    { key: "re-verification", label: "Re-verification" },
  ];

  return (
    <nav aria-label="Onboarding sections" className="flex flex-wrap gap-1.5">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={applicationsHref(tab.key === "applications" ? filters : {}, tab.key)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "focus-ring inline-flex h-[34px] items-center gap-1.5 rounded-lg px-4 text-[12.5px] font-medium whitespace-nowrap transition-colors motion-reduce:transition-none",
              isActive ? "bg-admin-primary text-white" : "bg-admin-muted text-admin-body hover:bg-admin-border/70",
            )}
          >
            {tab.label}
            {tab.count !== undefined ? <span>({tab.count})</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
