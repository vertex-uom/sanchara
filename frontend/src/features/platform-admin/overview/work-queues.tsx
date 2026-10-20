import { Suspense } from "react";
import Link from "next/link";
import { Globe, List, UserRoundCheck, type LucideIcon } from "lucide-react";
import { AdminCard, AdminCardHeader, AdminChip, AdminLink, AdminSkeleton } from "../components/ui";
import { adminNavItem, type AdminNavKey } from "../nav";
import { ICON_STROKE } from "../sidebar-modes";
import { getWorkQueues } from "../server/overview";
import type { WorkQueue, WorkQueueKey } from "../types";

// Each queue opens the tab that owns it. Subscriptions have no queue: a
// failed renewal blocks the company at once and payment restores it, so
// there is nothing for the platform team to work through. Reviews have no
// queue either: the platform team does not moderate guest content (Platform
// Admin must not read guests).
const QUEUE_META: Record<WorkQueueKey, { label: string; icon: LucideIcon; tab: AdminNavKey }> = {
  applications: { label: "Owner applications", icon: UserRoundCheck, tab: "onboarding" },
  "website-requests": { label: "Website build requests", icon: Globe, tab: "accounts" },
};

export function totalOpen(queues: WorkQueue[]) {
  return queues.reduce((sum, queue) => sum + queue.count, 0);
}

export function WorkQueues() {
  return (
    <AdminCard aria-labelledby="work-queues-title">
      <Suspense fallback={<WorkQueuesSkeleton />}>
        <WorkQueuesContent />
      </Suspense>
    </AdminCard>
  );
}

async function WorkQueuesContent() {
  const queues = await getWorkQueues();
  return (
    <>
      <AdminCardHeader
        id="work-queues-title"
        icon={List}
        title="Work queues"
        chip={<AdminChip tone="neutral">{totalOpen(queues)} open</AdminChip>}
        action={
          <AdminLink href={adminNavItem("onboarding").href} srContext="work queues">
            View all
          </AdminLink>
        }
      />
      <ul className="grid gap-3 sm:grid-cols-2">
        {queues.map((queue) => {
          const { label, icon: Icon, tab } = QUEUE_META[queue.key];
          return (
            <li key={queue.key}>
              <Link
                href={adminNavItem(tab).href}
                className="focus-ring flex h-full flex-col gap-2 rounded-[12px] border border-admin-border p-4 transition-colors hover:bg-admin-muted/60 motion-reduce:transition-none"
              >
                <span className="flex items-center gap-2.5">
                  <Icon aria-hidden="true" strokeWidth={ICON_STROKE} className="size-[22px] shrink-0 text-admin-icon" />
                  <span className="text-[12.5px] font-medium text-admin-body">{label}</span>
                </span>
                <span className="flex items-center gap-2.5">
                  <span className="text-[26px] leading-none font-semibold text-admin-heading">{queue.count}</span>
                  {queue.flag ? <AdminChip tone={queue.flag.tone}>{queue.flag.label}</AdminChip> : null}
                </span>
                <span className="text-[11px] text-admin-muted-text">{queue.note}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function WorkQueuesSkeleton() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Loading work queues</span>
      <AdminSkeleton className="mb-3.5 h-6 w-40" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.keys(QUEUE_META).map((key) => (
          <AdminSkeleton key={key} className="h-[104px] rounded-[12px]" />
        ))}
      </div>
    </div>
  );
}
