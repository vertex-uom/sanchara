import { Suspense } from "react";
import Link from "next/link";
import { UsersRound } from "lucide-react";
import { formatRelativeDateTime } from "@/lib/format/dates";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format/names";
import { AdminPagination } from "../components/pagination";
import { AdminTable, AdminTableEmpty, TABLE_CELL, TABLE_HEAD_CELL, TABLE_ROW } from "../components/table";
import { AdminCard, AdminCardHeader, AdminChip, AdminSkeleton } from "../components/ui";
import { listStaff } from "../server/users";
import type { StaffFilters } from "../types";
import { userHref, usersHref } from "./search-params";
import { SortSelect } from "./sort-select";
import { ROLE_META, STAFF_STATUS_META } from "./status";

const COLUMNS = ["User", "Role", "Company", "Status", "Last active"];

// User directory: five columns, the whole row opens the user.
export function UsersTable({ filters, selectedId, className }: { filters: StaffFilters; selectedId?: string; className?: string }) {
  return (
    <AdminCard aria-labelledby="users-title" className={className}>
      <Suspense fallback={<TableSkeleton />}>
        <TableBody filters={filters} selectedId={selectedId} />
      </Suspense>
    </AdminCard>
  );
}

async function TableBody({ filters, selectedId }: { filters: StaffFilters; selectedId?: string }) {
  const result = await listStaff(filters);
  const now = new Date();

  return (
    <>
      <AdminCardHeader id="users-title" icon={UsersRound} title="User directory" chip={<AdminChip tone="neutral">{result.total.toLocaleString("en-US")}</AdminChip>} action={<SortSelect filters={filters} />} />

      {result.items.length === 0 ? (
        <AdminTableEmpty>No users match these filters.</AdminTableEmpty>
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
            {result.items.map((user) => {
              const role = ROLE_META[user.role];
              const status = STAFF_STATUS_META[user.status];
              const selected = user.id === selectedId;
              const companySuspended = user.companyStatus === "suspended-admin" || user.companyStatus === "suspended-nonpayment";
              return (
                <tr key={user.id} className={cn("relative transition-colors motion-reduce:transition-none", TABLE_ROW, selected ? "bg-admin-primary-soft" : "hover:bg-admin-muted/60")}>
                  <td className={TABLE_CELL}>
                    <div className="flex items-center gap-2.5">
                      <span aria-hidden="true" className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-admin-primary-soft text-[10px] font-semibold text-admin-primary">
                        {initials(user.name)}
                      </span>
                      <div className="min-w-0 max-w-45">
                        {/* Stretched link: the whole row opens the user. */}
                        <Link href={userHref(user.id, filters)} aria-current={selected ? "page" : undefined} className="focus-ring block rounded-sm font-semibold after:absolute after:inset-0 after:content-['']">
                          {user.name}
                        </Link>
                        <span className="mt-0.5 block truncate text-[11px] font-normal text-admin-muted-text">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className={TABLE_CELL}>
                    <AdminChip tone={role.tone}>{role.label}</AdminChip>
                  </td>
                  <td className={TABLE_CELL}>
                    <span className="block">{user.companyName}</span>
                    {companySuspended ? <span className="mt-0.5 block text-[11px] font-medium text-admin-danger">Company suspended</span> : null}
                    {user.companyStatus === "pending" ? <span className="mt-0.5 block text-[11px] font-normal text-admin-muted-text">Company pending setup</span> : null}
                  </td>
                  <td className={TABLE_CELL}>
                    <AdminChip tone={status.tone} dot>
                      {status.label}
                    </AdminChip>
                  </td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap", user.lastActiveAt === null && "font-normal text-admin-muted-text")}>
                    {user.lastActiveAt ? <LastActive iso={user.lastActiveAt} now={now} /> : "Never"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
      )}

      {/* Paging keeps the open user (if any) in the side panel. */}
      <AdminPagination result={result} label="Users pages" hrefFor={(page) => (selectedId ? userHref(selectedId, { ...filters, page }) : usersHref({ ...filters, page }))} />
    </>
  );
}

// "Today, 10:12 AM" → day on one line, time muted below.
function LastActive({ iso, now }: { iso: string; now: Date }) {
  const [day, time] = formatRelativeDateTime(iso, now).split(", ");
  return (
    <time dateTime={iso} className="block">
      {day}
      {time ? <span className="block text-[11px] font-normal text-admin-muted-text">{time}</span> : null}
    </time>
  );
}

function TableSkeleton() {
  return (
    <div aria-busy="true" className="space-y-2">
      <span className="sr-only">Loading users</span>
      <AdminSkeleton className="mb-4 h-9.5" />
      <AdminSkeleton className="h-8" />
      {Array.from({ length: 8 }, (_, i) => (
        <AdminSkeleton key={i} className="h-14" />
      ))}
    </div>
  );
}
