import { Suspense } from "react";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { AdminCard, AdminCardHeader, AdminChip, AdminLink, AdminSkeleton } from "../components/ui";
import { adminNavItem } from "../nav";
import { ICON_STROKE } from "../sidebar-modes";
import { AUDIENCE_LABELS, describeChannels, formatWindow, TYPE_META } from "../announcements/status";
import { announcementHref } from "../announcements/search-params";
import { getActiveAnnouncements } from "../server/announcements";

export function Announcements({ className }: { className?: string }) {
  return (
    <AdminCard aria-labelledby="announcements-title" className={className}>
      <AdminCardHeader
        id="announcements-title"
        icon={Megaphone}
        title="Active announcements"
        action={
          <AdminLink href={adminNavItem("announcements").href} srContext="announcements">
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
        const { icon: Icon, label, tone } = TYPE_META[item.type];
        return (
          <li key={item.id} className="relative flex items-center gap-3 rounded-[10px] border border-admin-border px-3 py-2.5 transition-colors hover:bg-admin-muted/60 motion-reduce:transition-none">
            <Icon aria-hidden="true" strokeWidth={ICON_STROKE} className="size-[22px] shrink-0 text-admin-icon" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold text-admin-heading">
                {/* Stretched link: the whole row opens the announcement. */}
                <Link href={announcementHref(item.id)} className="focus-ring rounded-sm after:absolute after:inset-0 after:content-['']">
                  {item.title}
                </Link>
              </p>
              <p className="mt-0.5 truncate text-[10.5px] text-admin-muted-text">
                {formatWindow(item.startsAt, item.endsAt)} · {AUDIENCE_LABELS[item.audience]} · {describeChannels(item.channels)}
              </p>
            </div>
            <AdminChip tone={tone}>{label}</AdminChip>
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
