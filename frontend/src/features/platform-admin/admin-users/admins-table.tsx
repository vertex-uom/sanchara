import { Suspense } from "react";
import { Shield } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { formatRelativeDateTime } from "@/lib/format/dates";
import { cn } from "@/lib/utils";
import { AdminPagination } from "../components/pagination";
import { AdminTable, AdminTableEmpty, TABLE_CELL, TABLE_HEAD_CELL, TABLE_ROW } from "../components/table";
import { AdminCard, AdminCardHeader, AdminChip, AdminSkeleton } from "../components/ui";
import { adminNavItem } from "../nav";
import { listAdmins } from "../server/admin-users";
import { AdminRowAction } from "./admin-actions";
import { ADMIN_STATUS_META, initials } from "./status";

const COLUMNS = ["Admin", "Last sign-in", "Two-step", "Status", ""];

export function AdminsTable({ page }: { page: number }) {
  return (
    <AdminCard aria-labelledby="admins-title">
      <Suspense fallback={<TableSkeleton />}>
        <TableBody page={page} />
      </Suspense>
    </AdminCard>
  );
}

async function TableBody({ page }: { page: number }) {
  const [result, me] = await Promise.all([listAdmins(page), requireAdmin()]);
  const { counts } = result;
  const now = new Date();

  return (
    <>
      <AdminCardHeader id="admins-title" icon={Shield} title="Admin users" chip={<AdminChip tone="neutral">{counts.all}</AdminChip>} />
      {/* One-line summary instead of a KPI row. */}
      <p className="-mt-2 mb-3.5 text-[11.5px] text-admin-muted-text">
        {counts.active} active · {counts.invited} invited · {counts.deactivated} deactivated
      </p>

      {result.items.length === 0 ? (
        <AdminTableEmpty>No admin accounts.</AdminTableEmpty>
      ) : (
        <AdminTable minWidth={620}>
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
            {result.items.map((admin) => {
              const status = ADMIN_STATUS_META[admin.status];
              const isMe = admin.id === me.id;
              return (
                <tr key={admin.id} className={cn(TABLE_ROW, admin.status === "deactivated" && "text-admin-muted-text")}>
                  <td className={TABLE_CELL}>
                    <div className="flex items-center gap-2.5">
                      <span aria-hidden="true" className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-admin-primary-soft text-[10px] font-semibold text-admin-primary">
                        {initials(admin.name)}
                      </span>
                      <div className="min-w-0 max-w-[200px]">
                        <span className={cn("block font-semibold", admin.status === "deactivated" ? "text-admin-muted-text" : "text-admin-heading")}>
                          {admin.name}
                          {isMe ? <span className="ml-1.5 text-[10.5px] font-medium text-admin-primary">You</span> : null}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] font-normal text-admin-muted-text">{admin.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap", admin.lastSignInAt === null && "font-normal text-admin-muted-text")}>
                    {admin.lastSignInAt ? <time dateTime={admin.lastSignInAt}>{formatRelativeDateTime(admin.lastSignInAt, now)}</time> : "Never"}
                  </td>
                  <td className={TABLE_CELL}>
                    {admin.twoStep === "on" ? <AdminChip tone="success">On</AdminChip> : <AdminChip tone="warning">Pending</AdminChip>}
                  </td>
                  <td className={TABLE_CELL}>
                    <AdminChip tone={status.tone} dot>
                      {status.label}
                    </AdminChip>
                  </td>
                  <td className={cn(TABLE_CELL, "text-right whitespace-nowrap")}>
                    <AdminRowAction admin={admin} isCurrentUser={isMe} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
      )}

      <AdminPagination result={result} label="Admin users pages" hrefFor={(p) => `${adminNavItem("admin-users").href}${p > 1 ? `?page=${p}` : ""}`} />
    </>
  );
}

function TableSkeleton() {
  return (
    <div aria-busy="true" className="space-y-2">
      <span className="sr-only">Loading admin users</span>
      <AdminSkeleton className="mb-4 h-6 w-48" />
      <AdminSkeleton className="h-8" />
      {Array.from({ length: 10 }, (_, i) => (
        <AdminSkeleton key={i} className="h-14" />
      ))}
    </div>
  );
}
