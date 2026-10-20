import { Suspense } from "react";
import { Globe } from "lucide-react";
import { formatRelativeDateTime } from "@/lib/format/dates";
import { cn } from "@/lib/utils";
import { AdminTable, AdminTableEmpty, TABLE_CELL, TABLE_HEAD_CELL, TABLE_ROW } from "../components/table";
import { AdminCard, AdminCardHeader, AdminChip, AdminLink, AdminSkeleton } from "../components/ui";
import { listWebsiteRequests } from "../server/accounts";
import { websiteBuildHref } from "./search-params";
import { WEBSITE_REQUEST_STATUS_META } from "./status";

const COLUMNS = ["Company", "Requested", "Due", "Status", ""];
const DAY_MS = 24 * 60 * 60 * 1000;

// Open "build my website" requests from owners (architecture: "build a
// company website on request"). Each row links to the existing build route.
export function WebsiteRequests({ className }: { className?: string }) {
  return (
    <AdminCard aria-labelledby="website-requests-title" className={className}>
      <Suspense fallback={<RequestsSkeleton />}>
        <RequestsBody />
      </Suspense>
    </AdminCard>
  );
}

async function RequestsBody() {
  const requests = await listWebsiteRequests();
  const now = new Date();

  return (
    <>
      <AdminCardHeader id="website-requests-title" icon={Globe} title="Website requests" chip={<AdminChip tone="neutral">{requests.length}</AdminChip>} />
      {requests.length === 0 ? (
        <AdminTableEmpty>No open website requests.</AdminTableEmpty>
      ) : (
        <AdminTable minWidth={560}>
          <thead>
            <tr className="bg-admin-muted">
              {COLUMNS.map((column, i) => (
                <th key={i} scope="col" className={TABLE_HEAD_CELL}>
                  {column || <span className="sr-only">Action</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => {
              const status = WEBSITE_REQUEST_STATUS_META[request.status];
              const dueSoon = new Date(request.dueAt).getTime() - now.getTime() < 2 * DAY_MS;
              return (
                <tr key={request.id} className={TABLE_ROW}>
                  <td className={TABLE_CELL}>
                    <span className="block font-semibold">{request.companyName}</span>
                    <span className="mt-0.5 block text-[11px] font-normal text-admin-muted-text">
                      {request.location} · {request.companyId}
                    </span>
                  </td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap")}>
                    <time dateTime={request.requestedAt}>{formatRelativeDateTime(request.requestedAt, now)}</time>
                  </td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap", dueSoon && "text-admin-warning")}>
                    <time dateTime={request.dueAt}>{formatRelativeDateTime(request.dueAt, now)}</time>
                    {dueSoon ? <span className="sr-only"> (due soon)</span> : null}
                  </td>
                  <td className={TABLE_CELL}>
                    <AdminChip tone={status.tone} dot>
                      {status.label}
                    </AdminChip>
                  </td>
                  <td className={cn(TABLE_CELL, "text-right whitespace-nowrap")}>
                    <AdminLink href={websiteBuildHref(request.companyId)} srContext={`for ${request.companyName}`}>
                      Build website
                    </AdminLink>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
      )}
    </>
  );
}

function RequestsSkeleton() {
  return (
    <div aria-busy="true" className="space-y-2">
      <span className="sr-only">Loading website requests</span>
      <AdminSkeleton className="mb-4 h-6 w-48" />
      {Array.from({ length: 5 }, (_, i) => (
        <AdminSkeleton key={i} className="h-12" />
      ))}
    </div>
  );
}
