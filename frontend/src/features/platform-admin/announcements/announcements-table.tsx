import { Suspense } from "react";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminPagination } from "../components/pagination";
import { AdminTable, AdminTableEmpty, TABLE_CELL, TABLE_HEAD_CELL, TABLE_ROW } from "../components/table";
import { AdminCard, AdminCardHeader, AdminChip, AdminSkeleton } from "../components/ui";
import { listAnnouncements } from "../server/announcements";
import type { AnnouncementStatus } from "../types";
import { announcementHref, announcementsHref } from "./search-params";
import { AUDIENCE_LABELS, formatDay, formatWindow, TYPE_META } from "./status";

const COLUMNS = ["Announcement", "Type", "Audience", "Window"];

const SECTION_TITLE: Record<AnnouncementStatus, string> = {
  active: "Active announcements",
  scheduled: "Scheduled announcements",
  archived: "Archived announcements",
};

const EMPTY: Record<AnnouncementStatus, string> = {
  active: "Nothing is showing to company staff right now.",
  scheduled: "No announcements are scheduled.",
  archived: "No past announcements.",
};

// One row per announcement; the whole row opens it in the side panel.
export function AnnouncementsTable({ section, page, selectedId, className }: { section: AnnouncementStatus; page: number; selectedId?: string; className?: string }) {
  return (
    <AdminCard aria-labelledby="announcements-title" className={className}>
      <Suspense fallback={<TableSkeleton />}>
        <TableBody section={section} page={page} selectedId={selectedId} />
      </Suspense>
    </AdminCard>
  );
}

async function TableBody({ section, page, selectedId }: { section: AnnouncementStatus; page: number; selectedId?: string }) {
  const result = await listAnnouncements(section, page);

  return (
    <>
      <AdminCardHeader id="announcements-title" icon={Megaphone} title={SECTION_TITLE[section]} chip={<AdminChip tone="neutral">{result.total}</AdminChip>} />

      {result.items.length === 0 ? (
        <AdminTableEmpty>{EMPTY[section]}</AdminTableEmpty>
      ) : (
        <AdminTable minWidth={600}>
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
            {result.items.map((announcement) => {
              const type = TYPE_META[announcement.type];
              const selected = announcement.id === selectedId;
              return (
                <tr key={announcement.id} className={cn("relative transition-colors motion-reduce:transition-none", TABLE_ROW, selected ? "bg-admin-primary-soft" : "hover:bg-admin-muted/60")}>
                  <td className={cn(TABLE_CELL, "min-w-[200px]")}>
                    {/* Stretched link: the whole row opens the announcement. */}
                    <Link href={announcementHref(announcement.id, section, page)} aria-current={selected ? "page" : undefined} className="focus-ring block rounded-sm font-semibold after:absolute after:inset-0 after:content-['']">
                      {announcement.title}
                    </Link>
                    <span className="mt-0.5 block text-[11px] font-normal text-admin-muted-text">
                      {announcement.createdBy} · <time dateTime={announcement.createdAt}>{formatDay(announcement.createdAt)}</time>
                    </span>
                  </td>
                  <td className={TABLE_CELL}>
                    <AdminChip tone={type.tone}>{type.label}</AdminChip>
                  </td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap")}>{AUDIENCE_LABELS[announcement.audience]}</td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap")}>
                    {formatWindow(announcement.startsAt, announcement.endsAt, true)}
                    {announcement.archivedAt ? <span className="block text-[11px] font-normal text-admin-muted-text">Archived early</span> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
      )}

      {/* Paging keeps the open announcement (if any) in the side panel. */}
      <AdminPagination result={result} label="Announcements pages" hrefFor={(next) => (selectedId ? announcementHref(selectedId, section, next) : announcementsHref(section, next))} />
    </>
  );
}

function TableSkeleton() {
  return (
    <div aria-busy="true" className="space-y-2">
      <span className="sr-only">Loading announcements</span>
      <AdminSkeleton className="mb-4 h-[38px]" />
      <AdminSkeleton className="h-8" />
      {Array.from({ length: 6 }, (_, i) => (
        <AdminSkeleton key={i} className="h-14" />
      ))}
    </div>
  );
}
