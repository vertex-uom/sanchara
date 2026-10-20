import { Suspense } from "react";
import Link from "next/link";
import { List } from "lucide-react";
import { formatDateOnly } from "@/lib/format/dates";
import { cn } from "@/lib/utils";
import { AdminPagination } from "../components/pagination";
import { AdminTable, AdminTableEmpty, TABLE_CELL, TABLE_HEAD_CELL, TABLE_ROW } from "../components/table";
import { AdminCard, AdminCardHeader, AdminChip, AdminSkeleton } from "../components/ui";
import { applicationAgeDays, isOverdueApplication, listApplications } from "../server/onboarding";
import type { ApplicationFilters } from "../types";
import { applicationHref, applicationsHref } from "./search-params";
import { SortSelect } from "./sort-select";
import { APPLICATION_STATUS_META, formatAge } from "./status";

const COLUMNS = ["Business / Applicant", "Region", "Type", "Status", "Age", "Submitted"];

export function ApplicationsTable({ filters, selectedId, className }: { filters: ApplicationFilters; selectedId?: string; className?: string }) {
  return (
    <AdminCard aria-labelledby="applications-title" className={className}>
      <Suspense fallback={<TableSkeleton />}>
        <TableBody filters={filters} selectedId={selectedId} />
      </Suspense>
    </AdminCard>
  );
}

async function TableBody({ filters, selectedId }: { filters: ApplicationFilters; selectedId?: string }) {
  const result = await listApplications(filters);
  const now = new Date();

  return (
    <>
      <AdminCardHeader
        id="applications-title"
        icon={List}
        title="Applications"
        chip={<AdminChip tone="neutral">{result.total}</AdminChip>}
        action={<SortSelect filters={filters} />}
      />

      {result.items.length === 0 ? (
        <AdminTableEmpty>No applications match these filters.</AdminTableEmpty>
      ) : (
        <AdminTable minWidth={640}>
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
            {result.items.map((application) => {
              const status = APPLICATION_STATUS_META[application.status];
              const overdue = isOverdueApplication(application, now);
              const selected = application.id === selectedId;
              return (
                <tr
                  key={application.id}
                  className={cn("relative transition-colors motion-reduce:transition-none", TABLE_ROW, selected ? "bg-admin-primary-soft" : "hover:bg-admin-muted/60")}
                >
                  <td className={TABLE_CELL}>
                    {/* Stretched link: the whole row opens the application. */}
                    <Link
                      href={applicationHref(application.id, filters)}
                      aria-current={selected ? "page" : undefined}
                      className="focus-ring block rounded-sm font-semibold after:absolute after:inset-0 after:content-['']"
                    >
                      {application.businessName}
                    </Link>
                    <span className="mt-0.5 block text-[11px] font-normal text-admin-muted-text">{application.applicantName}</span>
                  </td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap")}>{application.region}</td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap")}>{application.businessType}</td>
                  <td className={TABLE_CELL}>
                    <AdminChip tone={status.tone} dot>
                      {status.label}
                    </AdminChip>
                  </td>
                  <td className={cn(TABLE_CELL, overdue && "text-admin-danger")}>
                    {formatAge(applicationAgeDays(application, now))}
                    {overdue ? <span className="sr-only"> (overdue)</span> : null}
                  </td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap")}>
                    <time dateTime={application.submittedAt}>{formatDateOnly(application.submittedAt.slice(0, 10))}</time>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
      )}

      {/* Paging keeps the open application (if any) in the side panel. */}
      <AdminPagination
        result={result}
        label="Applications pages"
        hrefFor={(page) => (selectedId ? applicationHref(selectedId, { ...filters, page }) : applicationsHref({ ...filters, page }))}
      />
    </>
  );
}

function TableSkeleton() {
  return (
    <div aria-busy="true" className="space-y-2">
      <span className="sr-only">Loading applications</span>
      <AdminSkeleton className="mb-4 h-[38px]" />
      <AdminSkeleton className="h-8" />
      {Array.from({ length: 8 }, (_, i) => (
        <AdminSkeleton key={i} className="h-14" />
      ))}
    </div>
  );
}
