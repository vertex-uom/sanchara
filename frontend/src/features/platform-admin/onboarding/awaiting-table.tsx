import { Suspense } from "react";
import Link from "next/link";
import { Hourglass } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatHistoryDateTime } from "../accounts/status";
import { companyHref } from "../accounts/search-params";
import { AdminPagination } from "../components/pagination";
import { AdminTable, AdminTableEmpty, TABLE_CELL, TABLE_HEAD_CELL, TABLE_ROW } from "../components/table";
import { AdminCard, AdminCardHeader, AdminChip, AdminSkeleton } from "../components/ui";
import { listAwaitingOwners } from "../server/onboarding";
import { RegenerateDialog, ResendEmailDialog } from "./owner-actions";
import { onboardingHref } from "./search-params";

const COLUMNS = ["Company", "Owner", "Plan", "Created", "Credentials", "Actions"];

// Companies whose Owner has not used the sign-in details yet. Expired
// credentials can only be regenerated; valid ones can also be re-sent.
export function AwaitingTable({ page }: { page: number }) {
  return (
    <AdminCard aria-labelledby="awaiting-owners-title">
      <Suspense fallback={<TableSkeleton />}>
        <TableBody page={page} />
      </Suspense>
    </AdminCard>
  );
}

async function TableBody({ page }: { page: number }) {
  const result = await listAwaitingOwners(page);
  const now = new Date();

  return (
    <>
      <AdminCardHeader id="awaiting-owners-title" icon={Hourglass} title="Awaiting the Owner's first sign-in" chip={<AdminChip tone="neutral">{result.total}</AdminChip>} />

      {result.items.length === 0 ? (
        <AdminTableEmpty>Every Owner has signed in. New companies appear here until their Owner does.</AdminTableEmpty>
      ) : (
        <AdminTable minWidth={820}>
          <thead>
            <tr className="bg-admin-muted">
              {COLUMNS.map((column) => (
                <th key={column} scope="col" className={cn(TABLE_HEAD_CELL, column === "Actions" && "text-right")}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.items.map((item) => {
              const expired = item.status === "expired";
              return (
                <tr key={item.companyId} className={cn(TABLE_ROW, "hover:bg-admin-muted/60")}>
                  <td className={cn(TABLE_CELL, "min-w-[200px]")}>
                    <Link href={companyHref(item.companyId)} className="focus-ring rounded-sm font-semibold hover:underline">
                      {item.companyName}
                    </Link>
                    <span className="mt-0.5 block text-[11px] font-normal text-admin-muted-text">
                      {item.subdomain} · {item.location}
                    </span>
                  </td>
                  <td className={cn(TABLE_CELL, "min-w-[160px]")}>
                    {item.ownerName}
                    <span className="block text-[11px] font-normal break-all text-admin-muted-text">{item.ownerEmail}</span>
                  </td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap")}>{item.plan}</td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap font-normal text-admin-body")}>
                    <time dateTime={item.createdAt}>{formatHistoryDateTime(item.createdAt, now)}</time>
                    <span className="block text-[11px] text-admin-muted-text">by {item.createdBy}</span>
                  </td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap")}>
                    <AdminChip tone={expired ? "danger" : "success"} dot>
                      {expired ? "Expired" : "Valid"}
                    </AdminChip>
                    <span className="mt-1 block text-[11px] font-normal text-admin-muted-text">
                      {item.credentialsExpireAt ? (
                        <>
                          Until <time dateTime={item.credentialsExpireAt}>{formatHistoryDateTime(item.credentialsExpireAt, now)}</time>
                        </>
                      ) : (
                        "Generate a new link"
                      )}
                    </span>
                  </td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap")}>
                    <div className="flex justify-end gap-1.5">
                      {!expired ? <ResendEmailDialog item={item} /> : null}
                      <RegenerateDialog item={item} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
      )}

      <AdminPagination result={result} label="Awaiting owners pages" hrefFor={onboardingHref} />
    </>
  );
}

function TableSkeleton() {
  return (
    <div aria-busy="true" className="space-y-2">
      <span className="sr-only">Loading companies awaiting sign-in</span>
      <AdminSkeleton className="mb-4 h-[38px]" />
      <AdminSkeleton className="h-8" />
      {Array.from({ length: 6 }, (_, i) => (
        <AdminSkeleton key={i} className="h-14" />
      ))}
    </div>
  );
}
