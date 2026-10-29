import { Suspense } from "react";
import { connection } from "next/server";
import { Building2, Clock, Coins, CreditCard, Globe, Megaphone, Shield, UserRoundCheck, type LucideIcon } from "lucide-react";
import { formatRelativeDateTime } from "@/lib/format/dates";
import { cn } from "@/lib/utils";
import { AdminCard, AdminCardHeader, AdminChip, AdminLink, AdminSkeleton } from "../components/ui";
import { adminNavItem } from "../nav";
import { ICON_STROKE } from "../sidebar-modes";
import { getRecentAdminActivity } from "../server/overview";
import type { AdminActivityKind } from "../types";

const KIND_ICONS: Record<AdminActivityKind, LucideIcon> = {
  company: Building2,
  subscription: CreditCard,
  "exchange-rate": Coins,
  role: Shield,
  user: UserRoundCheck,
  website: Globe,
  announcement: Megaphone,
};

export function RecentActivity({ className }: { className?: string }) {
  return (
    <AdminCard aria-labelledby="admin-activity-title" className={className}>
      <AdminCardHeader
        id="admin-activity-title"
        icon={Clock}
        title="Recent activities"
        action={<AdminLink href={adminNavItem("audit-logs").href}>View audit trail</AdminLink>}
      />
      <Suspense fallback={<ActivitySkeleton />}>
        <ActivityList />
      </Suspense>
    </AdminCard>
  );
}

async function ActivityList() {
  await connection(); // relative times depend on the current time
  const entries = await getRecentAdminActivity();
  const now = new Date();

  if (entries.length === 0) {
    return <p className="rounded-xl border border-dashed border-admin-border px-4 py-6 text-center text-sm text-admin-muted-text">No admin activity yet.</p>;
  }

  return (
    <ol>
      {entries.map((entry) => {
        const Icon = KIND_ICONS[entry.kind];
        return (
          <li key={entry.id} className="flex items-center gap-3 border-b border-admin-border py-2.5 last:border-b-0">
            {/* Rail dot: teal by default, danger for critical changes. */}
            <span
              aria-hidden="true"
              className={cn("size-2.5 shrink-0 rounded-full border-[2.5px] bg-white", entry.critical ? "border-admin-danger" : "border-admin-teal")}
            />
            <Icon aria-hidden="true" strokeWidth={ICON_STROKE} className="size-5.5 shrink-0 text-admin-icon" />
            <div className="flex min-w-0 flex-1 flex-col gap-x-4 gap-y-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-admin-heading">
                  {entry.title}
                  {entry.critical ? <AdminChip tone="danger">Critical</AdminChip> : null}
                </p>
                <p className="mt-0.5 text-[11px] break-words text-admin-muted-text">{entry.detail}</p>
              </div>
              <p className="shrink-0 text-[11px] sm:text-right">
                <time dateTime={entry.occurredAt} className="font-medium text-admin-body">
                  {formatRelativeDateTime(entry.occurredAt, now)}
                </time>
                <span className="block text-admin-muted-text">by {entry.actor}</span>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ActivitySkeleton() {
  return (
    <div aria-busy="true" className="space-y-2">
      <span className="sr-only">Loading recent activities</span>
      {Array.from({ length: 6 }, (_, i) => (
        <AdminSkeleton key={i} className="h-12" />
      ))}
    </div>
  );
}
