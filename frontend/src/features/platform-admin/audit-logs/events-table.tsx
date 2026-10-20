import { Suspense } from "react";
import Link from "next/link";
import { FileText, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatHistoryDateTime } from "../accounts/status";
import { AdminPagination } from "../components/pagination";
import { AdminTable, AdminTableEmpty, TABLE_CELL, TABLE_HEAD_CELL, TABLE_ROW } from "../components/table";
import { AdminCard, AdminCardHeader, AdminChip, AdminSkeleton } from "../components/ui";
import { listAuditEvents } from "../server/audit";
import { ICON_STROKE } from "../sidebar-modes";
import type { AuditFilters } from "../types";
import { auditEventHref, auditLogsHref, hasActiveFilters } from "./search-params";
import { CATEGORY_META } from "./status";

const COLUMNS = ["Event", "Actor", "Target", "When"];

// One row per event; the whole row opens it in the side panel. Critical
// events get a warning marker; failed sign-ins a Failed chip.
export function EventsTable({ filters, selectedId, className }: { filters: AuditFilters; selectedId?: string; className?: string }) {
  return (
    <AdminCard aria-labelledby="audit-events-title" className={className}>
      <Suspense fallback={<TableSkeleton />}>
        <TableBody filters={filters} selectedId={selectedId} />
      </Suspense>
    </AdminCard>
  );
}

async function TableBody({ filters, selectedId }: { filters: AuditFilters; selectedId?: string }) {
  const result = await listAuditEvents(filters);
  const now = new Date();

  return (
    <>
      <AdminCardHeader id="audit-events-title" icon={FileText} title="Event log" chip={<AdminChip tone="neutral">{result.total.toLocaleString("en-US")}</AdminChip>} />

      {result.items.length === 0 ? (
        <AdminTableEmpty>{hasActiveFilters(filters) ? "No events match these filters." : "No events recorded yet."}</AdminTableEmpty>
      ) : (
        <AdminTable minWidth={600}>
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
            {result.items.map((event) => {
              const category = CATEGORY_META[event.category];
              const selected = event.id === selectedId;
              return (
                <tr key={event.id} className={cn("relative transition-colors motion-reduce:transition-none", TABLE_ROW, selected ? "bg-admin-primary-soft" : "hover:bg-admin-muted/60")}>
                  <td className={cn(TABLE_CELL, "min-w-[200px]")}>
                    <span className="flex items-start gap-2">
                      {event.critical ? <TriangleAlert aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-0.5 size-4 shrink-0 text-admin-danger" /> : <category.icon aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-0.5 size-4 shrink-0 text-admin-icon" />}
                      <span className="min-w-0">
                        {/* Stretched link: the whole row opens the event. */}
                        <Link href={auditEventHref(event.id, filters)} aria-current={selected ? "page" : undefined} className="focus-ring block rounded-sm font-semibold after:absolute after:inset-0 after:content-['']">
                          {event.action}
                          {event.critical ? <span className="sr-only"> (critical)</span> : null}
                        </Link>
                        <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-normal text-admin-muted-text">
                          {category.label}
                          {event.failed ? <AdminChip tone="danger">Failed</AdminChip> : null}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap")}>
                    {event.actor.name}
                    {event.actor.email ? <span className="block text-[11px] font-normal text-admin-muted-text">{event.actor.email}</span> : null}
                  </td>
                  <td className={cn(TABLE_CELL, "min-w-[140px] font-normal text-admin-body")}>{event.target ? event.target.label : <span className="text-admin-muted-text">—</span>}</td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap font-normal text-admin-body")}>
                    <time dateTime={event.at}>{formatHistoryDateTime(event.at, now)}</time>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
      )}

      {/* Paging keeps the open event (if any) in the side panel. */}
      <AdminPagination result={result} label="Audit event pages" hrefFor={(next) => (selectedId ? auditEventHref(selectedId, { ...filters, page: next }) : auditLogsHref({ ...filters, page: next }))} />
    </>
  );
}

function TableSkeleton() {
  return (
    <div aria-busy="true" className="space-y-2">
      <span className="sr-only">Loading audit events</span>
      <AdminSkeleton className="mb-4 h-[38px]" />
      <AdminSkeleton className="h-8" />
      {Array.from({ length: 10 }, (_, i) => (
        <AdminSkeleton key={i} className="h-14" />
      ))}
    </div>
  );
}
