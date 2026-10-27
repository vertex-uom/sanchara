import { Suspense } from "react";
import Link from "next/link";
import { ScrollText, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminPagination } from "../components/pagination";
import { AdminTable, AdminTableEmpty, TABLE_CELL, TABLE_HEAD_CELL, TABLE_ROW } from "../components/table";
import { AdminCard, AdminCardHeader, AdminChip, AdminSkeleton } from "../components/ui";
import { ICON_STROKE } from "../sidebar-modes";
import { listEnforcementLogPage } from "../server/accounts";
import { companyHref, enforcementHref } from "./search-params";
import { ENFORCEMENT_KIND_META, formatDateTime } from "./status";

const COLUMNS = ["Company", "Action", "Reason", "By", "Date"];

// Every suspension, reactivation and warning across the platform, newest
// first. Non-payment suspensions are automatic and attributed to "System".
export function EnforcementLog({ page }: { page: number }) {
  return (
    <AdminCard aria-labelledby="enforcement-title">
      <Suspense fallback={<LogSkeleton />}>
        <LogBody page={page} />
      </Suspense>
    </AdminCard>
  );
}

async function LogBody({ page }: { page: number }) {
  const result = await listEnforcementLogPage(page);

  return (
    <>
      <AdminCardHeader id="enforcement-title" icon={ScrollText} title="Enforcement log" chip={<AdminChip tone="neutral">{result.total}</AdminChip>} />
      {result.items.length === 0 ? (
        <AdminTableEmpty>No enforcement actions recorded.</AdminTableEmpty>
      ) : (
        <AdminTable minWidth={720}>
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
            {result.items.map((entry) => {
              const kind = ENFORCEMENT_KIND_META[entry.kind];
              return (
                <tr key={entry.id} className={cn("relative transition-colors hover:bg-admin-muted/60 motion-reduce:transition-none", TABLE_ROW)}>
                  <td className={TABLE_CELL}>
                    <Link href={companyHref(entry.companyId)} className="focus-ring block rounded-sm font-semibold after:absolute after:inset-0 after:content-['']">
                      {entry.companyName}
                    </Link>
                    <span className="mt-0.5 block text-[11px] font-normal text-admin-muted-text">{entry.companyId}</span>
                  </td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap")}>
                    <AdminChip tone={kind.tone} dot>
                      {kind.label}
                    </AdminChip>
                  </td>
                  <td className={cn(TABLE_CELL, "max-w-[320px] font-normal text-admin-body")}>
                    {entry.critical ? (
                      <TriangleAlert aria-label="Critical" strokeWidth={ICON_STROKE} className="mr-1.5 inline size-4 -translate-y-px text-admin-danger" />
                    ) : null}
                    {entry.reason}
                  </td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap")}>{entry.actor}</td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap")}>
                    <time dateTime={entry.occurredAt}>{formatDateTime(entry.occurredAt)}</time>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
      )}
      <AdminPagination result={result} label="Enforcement log pages" hrefFor={enforcementHref} />
    </>
  );
}

function LogSkeleton() {
  return (
    <div aria-busy="true" className="space-y-2">
      <span className="sr-only">Loading enforcement log</span>
      <AdminSkeleton className="mb-4 h-6 w-48" />
      <AdminSkeleton className="h-8" />
      {Array.from({ length: 8 }, (_, i) => (
        <AdminSkeleton key={i} className="h-14" />
      ))}
    </div>
  );
}
