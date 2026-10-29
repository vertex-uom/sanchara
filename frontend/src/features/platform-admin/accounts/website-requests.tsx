import { Suspense } from "react";
import Link from "next/link";
import { Globe } from "lucide-react";
import { ASSISTANCE_TIMINGS, labelOf } from "@/features/website-builder";
import { DAY_MS, formatRelativeDateTime } from "@/lib/format/dates";
import { cn } from "@/lib/utils";
import { AdminTable, AdminTableEmpty, TABLE_CELL, TABLE_HEAD_CELL, TABLE_ROW } from "../components/table";
import { AdminCard, AdminCardHeader, AdminChip, AdminSkeleton } from "../components/ui";
import { listWebsiteRequestRows } from "../server/website-requests";
import type { WebsiteRequestFilters } from "../types";
import { websiteRequestHref } from "./search-params";
import { WEBSITE_REQUEST_STATUS_META } from "./status";
import { WebsiteRequestFiltersBar } from "./website-request-filters";

const COLUMNS = ["Company", "Needed by", "Assigned to", "Requested", "Due", "Status"];

// Website requests tab: open "build my website" requests sent from the Back
// Office (WEMIXT assistance), soonest due first. Each row opens the request
// with everything the company sent.
export function WebsiteRequestsList({ filters }: { filters: WebsiteRequestFilters }) {
  return (
    <Suspense fallback={<RequestsSkeleton />}>
      <RequestsBody filters={filters} />
    </Suspense>
  );
}

async function RequestsBody({ filters }: { filters: WebsiteRequestFilters }) {
  const { items, total, assignees } = await listWebsiteRequestRows(filters);
  const now = new Date();

  return (
    <>
      <WebsiteRequestFiltersBar filters={filters} assignees={assignees} />
      <AdminCard aria-labelledby="website-requests-title">
        <AdminCardHeader id="website-requests-title" icon={Globe} title="Website requests" chip={<AdminChip tone="neutral">{items.length === total ? total : `${items.length} of ${total}`}</AdminChip>} />
        {items.length === 0 ? (
          <AdminTableEmpty>{total === 0 ? "No open website requests." : "No website requests match these filters."}</AdminTableEmpty>
        ) : (
          <AdminTable minWidth={760}>
            <thead>
              <tr className="bg-admin-muted">
                {COLUMNS.map((column) => (
                  <th key={column} scope="col" className={TABLE_HEAD_CELL}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((request) => {
                const status = WEBSITE_REQUEST_STATUS_META[request.status];
                const dueSoon = request.dueAt !== null && new Date(request.dueAt).getTime() - now.getTime() < 2 * DAY_MS;
                return (
                  <tr key={request.id} className={cn("relative transition-colors hover:bg-admin-muted/60 motion-reduce:transition-none", TABLE_ROW)}>
                    <td className={TABLE_CELL}>
                      <Link href={websiteRequestHref(request.id)} className="focus-ring block rounded-sm font-semibold after:absolute after:inset-0 after:content-['']">
                        {request.companyName}
                      </Link>
                      <span className="mt-0.5 block text-[11px] font-normal text-admin-muted-text">
                        {request.location ? `${request.location} · ` : ""}
                        {request.reference}
                      </span>
                    </td>
                    <td className={cn(TABLE_CELL, "font-normal text-admin-body")}>{labelOf(ASSISTANCE_TIMINGS, request.timing)}</td>
                    <td className={cn(TABLE_CELL, "whitespace-nowrap")}>{request.assignee ? request.assignee.name : <span className="font-normal text-admin-muted-text">Unassigned</span>}</td>
                    <td className={cn(TABLE_CELL, "whitespace-nowrap font-normal")}>
                      <time dateTime={request.requestedAt}>{formatRelativeDateTime(request.requestedAt, now)}</time>
                    </td>
                    <td className={cn(TABLE_CELL, "whitespace-nowrap", dueSoon && "text-admin-warning")}>
                      {request.dueAt ? <time dateTime={request.dueAt}>{formatRelativeDateTime(request.dueAt, now)}</time> : <span className="font-normal text-admin-muted-text">No rush</span>}
                      {dueSoon ? <span className="sr-only"> (due soon)</span> : null}
                    </td>
                    <td className={TABLE_CELL}>
                      <AdminChip tone={status.tone} dot>
                        {status.label}
                      </AdminChip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </AdminTable>
        )}
      </AdminCard>
    </>
  );
}

function RequestsSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">Loading website requests</span>
      <AdminSkeleton className="h-22 rounded-[14px]" />
      <div className="space-y-2 rounded-[14px] border border-admin-border bg-admin-card p-5">
        <AdminSkeleton className="mb-4 h-6 w-48" />
        {Array.from({ length: 6 }, (_, i) => (
          <AdminSkeleton key={i} className="h-12" />
        ))}
      </div>
    </div>
  );
}
