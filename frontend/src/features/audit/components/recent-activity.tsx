import { Suspense } from "react";
import { connection } from "next/server";
import { CalendarDays, CreditCard, History, ReceiptText, Settings, Tag, UserRound, type LucideIcon } from "lucide-react";
import { formatRelativeDateTime } from "@/lib/format/dates";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { EmptyState, Skeleton, WidgetCard, WidgetHeader, WidgetLink } from "@/components/ui/widget";
import { getRecentActivity } from "../server/activity";
import type { AuditEntryKind } from "../types";

const KIND_ICONS: Record<AuditEntryKind, LucideIcon> = {
  rate: Tag,
  reservation: CalendarDays,
  payment: CreditCard,
  refund: ReceiptText,
  staff: UserRound,
  settings: Settings,
  other: History,
};

// showAuditLink: only for roles that can open the Audit Trail.
export function RecentActivity({ propertyId, showAuditLink }: { propertyId: string; showAuditLink: boolean }) {
  return (
    <WidgetCard aria-labelledby="activity-title" className="h-full">
      <WidgetHeader
        id="activity-title"
        title="Recent activity"
        action={showAuditLink ? <WidgetLink href={COMPANY_PATHS.audit}>View audit trail</WidgetLink> : undefined}
      />
      <Suspense fallback={<ActivitySkeleton />}>
        <ActivityList propertyId={propertyId} />
      </Suspense>
    </WidgetCard>
  );
}

async function ActivityList({ propertyId }: { propertyId: string }) {
  await connection(); // relative times depend on the current time
  const entries = await getRecentActivity(propertyId);
  const now = new Date();

  if (entries.length === 0) return <EmptyState>No activity recorded yet.</EmptyState>;

  return (
    // The vertical rule on the left links the entries into a timeline.
    <ol className="relative space-y-3 sm:pl-6 sm:before:absolute sm:before:top-4 sm:before:bottom-4 sm:before:left-2 sm:before:w-0.5 sm:before:rounded-full sm:before:bg-office-icon">
      {entries.map((entry) => {
        const Icon = KIND_ICONS[entry.kind];
        return (
          <li key={entry.id} className="flex gap-3 rounded-xl border border-border p-3">
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-office-chip text-office-icon">
              <Icon className="size-5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-x-4 gap-y-1 sm:flex-row sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">{entry.title}</p>
                <p className="text-sm break-words text-office-accent">{entry.detail}</p>
              </div>
              <p className="shrink-0 text-xs text-muted-foreground sm:text-right">
                <time dateTime={entry.occurredAt} className="text-office-accent">{formatRelativeDateTime(entry.occurredAt, now)}</time>
                <span className="block">
                  by {entry.actor.name} ({entry.actor.roleLabel})
                </span>
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
    <div aria-busy="true" className="space-y-3">
      <span className="sr-only">Loading recent activity</span>
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-16 rounded-xl" />
    </div>
  );
}
