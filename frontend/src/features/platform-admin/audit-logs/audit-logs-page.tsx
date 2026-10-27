import { Suspense } from "react";
import { Download } from "lucide-react";
import { type SearchParams } from "@/lib/routes/search-params";
import { AdminPageHeader } from "../components/page-header";
import { AdminButton, AdminSkeleton } from "../components/ui";
import { adminNavItem } from "../nav";
import { listAuditActors } from "../server/audit";
import { EventDetail, DetailPlaceholder } from "./event-detail";
import { EventsTable } from "./events-table";
import { FiltersBar } from "./filters-bar";
import { parseFilters } from "./search-params";

type Props = {
  searchParams: Promise<SearchParams>;
  // Set by the /audit-logs/[eventId] route; opens the detail panel
  // (beside the list from xl, on its own below).
  params?: Promise<{ eventId: string }>;
};

// Audit Logs: what the platform team did in this console, kept for one
// year. The design's trace view, saved searches, alerts, compliance reports,
// impersonation and hash-chain KPIs have no module behind them and are
// intentionally absent. Company-staff activity is owner-only and never
// shown here. Filters and page live in the URL.
export function AuditLogsPage({ searchParams, params }: Props) {
  const item = adminNavItem("audit-logs");
  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title={item.pageTitle ?? item.label}
        description={item.description}
        actions={
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
  const [query, route, actors] = await Promise.all([searchParams, params, listAuditActors()]);
  const filters = parseFilters(query);
  const selectedId = route?.eventId;

  return (
    <>
      <FiltersBar filters={filters} actors={actors} />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 xl:grid-cols-[minmax(0,704fr)_minmax(0,400fr)]">
        <EventsTable filters={filters} selectedId={selectedId} className={selectedId ? "hidden xl:block" : undefined} />
        {selectedId ? <EventDetail id={selectedId} filters={filters} /> : <DetailPlaceholder className="hidden xl:flex" />}
      </div>
    </>
  );
}

function WorkspaceSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">Loading audit log</span>
      <AdminSkeleton className="h-[86px] rounded-[14px]" />
      <AdminSkeleton className="h-[560px] rounded-[14px]" />
    </div>
  );
}
