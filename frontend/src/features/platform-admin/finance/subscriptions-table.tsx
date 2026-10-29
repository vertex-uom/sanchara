import { Suspense } from "react";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { colomboDateKey, formatDateOnly } from "@/lib/format/dates";
import { formatMoney } from "@/lib/format/money";
import { cn } from "@/lib/utils";
import { AdminPagination } from "../components/pagination";
import { AdminTable, AdminTableEmpty, TABLE_CELL, TABLE_HEAD_CELL, TABLE_ROW } from "../components/table";
import { AdminCard, AdminCardHeader, AdminChip, AdminSkeleton } from "../components/ui";
import { listSubscriptions } from "../server/finance";
import type { CompanySubscription, SubscriptionFilters } from "../types";
import { subscriptionHref, subscriptionsHref } from "./search-params";
import { SortSelect } from "./sort-select";
import { daysFromToday, describeDays, SUBSCRIPTION_STATUS_META } from "./status";

const COLUMNS = ["Company", "Plan", "Monthly", "Status", "Renews / failed", "Data kept until"];

// One row per company; the whole row opens the subscription.
export function SubscriptionsTable({ filters, selectedId, className }: { filters: SubscriptionFilters; selectedId?: string; className?: string }) {
  return (
    <AdminCard aria-labelledby="subscriptions-title" className={className}>
      <Suspense fallback={<TableSkeleton />}>
        <TableBody filters={filters} selectedId={selectedId} />
      </Suspense>
    </AdminCard>
  );
}

async function TableBody({ filters, selectedId }: { filters: SubscriptionFilters; selectedId?: string }) {
  const result = await listSubscriptions(filters);
  const today = colomboDateKey(new Date());

  return (
    <>
      <AdminCardHeader id="subscriptions-title" icon={CreditCard} title="Subscriptions" chip={<AdminChip tone="neutral">{result.total.toLocaleString("en-US")}</AdminChip>} action={<SortSelect filters={filters} />} />

      {result.items.length === 0 ? (
        <AdminTableEmpty>No subscriptions match these filters.</AdminTableEmpty>
      ) : (
        <AdminTable minWidth={640}>
          <thead>
            <tr className="bg-admin-muted">
              {COLUMNS.map((column) => (
                <th key={column} scope="col" className={cn(TABLE_HEAD_CELL, column === "Monthly" && "text-right")}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.items.map((subscription) => {
              const status = SUBSCRIPTION_STATUS_META[subscription.status];
              const selected = subscription.id === selectedId;
              return (
                <tr key={subscription.id} className={cn("relative transition-colors motion-reduce:transition-none", TABLE_ROW, selected ? "bg-admin-primary-soft" : "hover:bg-admin-muted/60")}>
                  <td className={cn(TABLE_CELL, "min-w-37.5")}>
                    {/* Stretched link: the whole row opens the subscription. */}
                    <Link href={subscriptionHref(subscription.id, filters)} aria-current={selected ? "page" : undefined} className="focus-ring block rounded-sm font-semibold after:absolute after:inset-0 after:content-['']">
                      {subscription.companyName}
                    </Link>
                    <span className="mt-0.5 block text-[11px] font-normal text-admin-muted-text">{subscription.location}</span>
                  </td>
                  <td className={TABLE_CELL}>{subscription.plan}</td>
                  <td className={cn(TABLE_CELL, "text-right whitespace-nowrap tabular-nums")}>{formatMoney(subscription.price)}</td>
                  <td className={TABLE_CELL}>
                    <AdminChip tone={status.tone} dot>
                      {status.label}
                    </AdminChip>
                  </td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap")}>
                    <DueCell subscription={subscription} today={today} />
                  </td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap")}>
                    <RetentionCell subscription={subscription} today={today} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
      )}

      {/* Paging keeps the open subscription (if any) in the side panel. */}
      <AdminPagination result={result} label="Subscriptions pages" hrefFor={(page) => (selectedId ? subscriptionHref(selectedId, { ...filters, page }) : subscriptionsHref({ ...filters, page }))} />
    </>
  );
}

// Next renewal for paid subscriptions; for blocked and closed companies the
// renewal that failed. The second line says how far away that is.
function DueCell({ subscription, today }: { subscription: CompanySubscription; today: string }) {
  if (!subscription.dueAt) return <span className="font-normal text-admin-muted-text">After setup</span>;
  const days = daysFromToday(subscription.dueAt, today);
  const failed = subscription.status !== "paid";
  return (
    <time dateTime={subscription.dueAt} className="block">
      {formatDateOnly(subscription.dueAt)}
      <span className={cn("block text-[11px]", failed ? "font-medium text-admin-danger" : "font-normal text-admin-muted-text")}>{describeDays(days)}</span>
    </time>
  );
}

// Suspended only: one year after the failed renewal the data is deleted. Red
// inside the last 30 days.
function RetentionCell({ subscription, today }: { subscription: CompanySubscription; today: string }) {
  if (subscription.status === "closed") return <span className="text-[11px] font-medium text-admin-muted-text">Deleted</span>;
  if (!subscription.dataKeptUntil) return <span aria-label="Not applicable">—</span>;
  const days = daysFromToday(subscription.dataKeptUntil, today);
  return (
    <time dateTime={subscription.dataKeptUntil} className="block">
      {formatDateOnly(subscription.dataKeptUntil)}
      <span className={cn("block text-[11px]", days <= 30 ? "font-medium text-admin-danger" : "font-normal text-admin-muted-text")}>{describeDays(days)}</span>
    </time>
  );
}

function TableSkeleton() {
  return (
    <div aria-busy="true" className="space-y-2">
      <span className="sr-only">Loading subscriptions</span>
      <AdminSkeleton className="mb-4 h-9.5" />
      <AdminSkeleton className="h-8" />
      {Array.from({ length: 8 }, (_, i) => (
        <AdminSkeleton key={i} className="h-14" />
      ))}
    </div>
  );
}
