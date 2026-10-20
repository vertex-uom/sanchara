import { Suspense } from "react";
import { FileText, Info, Megaphone, Wrench, Zap, type LucideIcon } from "lucide-react";
import { AdminCard, AdminCardHeader, AdminChip, AdminLink, AdminSkeleton } from "../components/ui";
import { adminNavItem } from "../nav";
import { ICON_STROKE } from "../sidebar-modes";
import { getActiveAnnouncements } from "../server/overview";
import type { AnnouncementKind, Tone } from "../types";

const KIND_META: Record<AnnouncementKind, { icon: LucideIcon; chip: string; tone: Tone }> = {
  feature: { icon: Zap, chip: "Feature", tone: "success" },
  maintenance: { icon: Wrench, chip: "Maintenance", tone: "info" },
  policy: { icon: FileText, chip: "Policy", tone: "neutral" },
  reminder: { icon: Info, chip: "Reminder", tone: "success" },
};

export function Announcements({ className }: { className?: string }) {
  return (
    <AdminCard aria-labelledby="announcements-title" className={className}>
      <AdminCardHeader
        id="announcements-title"
        icon={Megaphone}
        title="Active announcements"
        action={
          <AdminLink href={adminNavItem("help").href} srContext="announcements">
            View all
          </AdminLink>
        }
      />
      <Suspense fallback={<AnnouncementsSkeleton />}>
        <AnnouncementList />
      </Suspense>
    </AdminCard>
  );
}

async function AnnouncementList() {
  const announcements = await getActiveAnnouncements();

  if (announcements.length === 0) {
    return <p className="rounded-xl border border-dashed border-admin-border px-4 py-6 text-center text-sm text-admin-muted-text">No active announcements.</p>;
  }

  return (
    <ul className="space-y-2.5">
      {announcements.map((item) => {
        const { icon: Icon, chip, tone } = KIND_META[item.kind];
        return (
          <li key={item.id} className="flex items-center gap-3 rounded-[10px] border border-admin-border px-3 py-2.5">
            <Icon aria-hidden="true" strokeWidth={ICON_STROKE} className="size-[22px] shrink-0 text-admin-icon" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold text-admin-heading">{item.title}</p>
              <p className="mt-0.5 truncate text-[10.5px] text-admin-muted-text">{item.meta}</p>
            </div>
            <AdminChip tone={tone}>{chip}</AdminChip>
          </li>
        );
      })}
    </ul>
  );
}

function AnnouncementsSkeleton() {
  return (
    <div aria-busy="true" className="space-y-2.5">
      <span className="sr-only">Loading announcements</span>
      {Array.from({ length: 4 }, (_, i) => (
        <AdminSkeleton key={i} className="h-[54px] rounded-[10px]" />
      ))}
    </div>
  );
}
