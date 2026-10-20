import { Info } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { adminNavItem } from "../nav";
import { ICON_STROKE } from "../sidebar-modes";
import { Announcements } from "./announcements";
import { KpiRow } from "./kpi-row";
import { QuickActions } from "./quick-actions";
import { RecentActivity } from "./recent-activity";
import { RecentCompanies } from "./recent-companies";
import { WorkQueues } from "./work-queues";

// Platform Overview. Every widget is a Server Component that streams in
// behind its own Suspense boundary; none of them read booking or guest data.
export function PlatformOverview() {
  const item = adminNavItem("overview");
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={item.pageTitle ?? item.label} description={item.description} />
      <QuickActions />
      <KpiRow />
      <WorkQueues />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,644fr)_minmax(0,460fr)]">
        <RecentActivity />
        <Announcements />
      </div>
      <RecentCompanies />
      <p className="flex items-center gap-2 text-[11px] text-admin-muted-text">
        <Info aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4 shrink-0" />
        Every create, edit, approve and configuration action asks for confirmation (sensitive actions need a reason) and is recorded in the audit log.
      </p>
    </div>
  );
}
