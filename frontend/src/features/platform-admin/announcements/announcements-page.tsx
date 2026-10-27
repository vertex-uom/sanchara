import { Suspense } from "react";
import { PageHeader } from "../components/page-header";
import { AdminSubTabs } from "../components/sub-tabs";
import { AdminSkeleton } from "../components/ui";
import { adminNavItem } from "../nav";
import { getAnnouncementCounts } from "../server/announcements";
import type { AnnouncementStatus } from "../types";
import { NewAnnouncementDialog } from "./announcement-actions";
import { AnnouncementDetail, DetailPlaceholder } from "./announcement-detail";
import { AnnouncementsTable } from "./announcements-table";
import { announcementsHref, parsePage, parseSection, type SearchParams } from "./search-params";

type Props = {
  searchParams: Promise<SearchParams>;
  // Set by the /announcements/[announcementId] route; opens the detail
  // panel (beside the list from xl, on its own below).
  params?: Promise<{ announcementId: string }>;
};

// Announcements: platform messages to company staff (Back Office banner,
// email, or both). The design's help centre, maintenance-notice tab, KPIs,
// push channel and region targeting have no module behind them and are
// intentionally absent. Section and page live in the URL.
export function AnnouncementsPage({ searchParams, params }: Props) {
  const item = adminNavItem("announcements");
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={item.pageTitle ?? item.label} description={item.description} actions={<NewAnnouncementDialog />} />
      <Suspense fallback={<WorkspaceSkeleton />}>
        <Workspace searchParams={searchParams} params={params} />
      </Suspense>
    </div>
  );
}

async function Workspace({ searchParams, params }: Props) {
  const [query, route] = await Promise.all([searchParams, params]);
  const selectedId = route?.announcementId;
  const section = parseSection(query);
  const page = parsePage(query);

  return (
    <>
      <SubTabs active={section} />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 xl:grid-cols-[minmax(0,704fr)_minmax(0,400fr)]">
        <AnnouncementsTable section={section} page={page} selectedId={selectedId} className={selectedId ? "hidden xl:block" : undefined} />
        {selectedId ? <AnnouncementDetail id={selectedId} section={section} page={page} /> : <DetailPlaceholder className="hidden xl:flex" />}
      </div>
    </>
  );
}

async function SubTabs({ active }: { active: AnnouncementStatus }) {
  const counts = await getAnnouncementCounts();
  return (
    <AdminSubTabs
      label="Announcement sections"
      active={active}
      tabs={[
        { key: "active", label: "Active", count: counts.active, href: announcementsHref("active") },
        { key: "scheduled", label: "Scheduled", count: counts.scheduled, href: announcementsHref("scheduled") },
        { key: "archived", label: "Archived", count: counts.archived, href: announcementsHref("archived") },
      ]}
    />
  );
}

function WorkspaceSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">Loading announcements</span>
      <AdminSkeleton className="h-[34px] w-80 max-w-full" />
      <AdminSkeleton className="h-[520px] rounded-[14px]" />
    </div>
  );
}
