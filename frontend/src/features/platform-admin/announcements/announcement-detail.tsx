import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminCard, AdminChip, AdminSkeleton } from "../components/ui";
import { ICON_STROKE } from "../sidebar-modes";
import { getAnnouncement } from "../server/announcements";
import type { Announcement, AnnouncementStatus } from "../types";
import { ArchiveAnnouncementDialog, EditAnnouncementDialog } from "./announcement-actions";
import { BannerPreview } from "./banner-preview";
import { announcementsHref } from "./search-params";
import { AUDIENCE_LABELS, CHANNEL_LABELS, formatInstant, STATUS_META, TYPE_META } from "./status";

// Right-hand detail panel (400px in the design): the message as staff see
// it, who gets it and when, and the two actions that exist (edit, archive).
export function AnnouncementDetail({ id, section, page }: { id: string; section: AnnouncementStatus; page: number }) {
  return (
    <AdminCard aria-labelledby="announcement-title" className="flex flex-col gap-5">
      <Link
        href={announcementsHref(section, page)}
        className="focus-ring -mb-2 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-md text-xs font-medium text-admin-primary underline-offset-4 hover:underline xl:hidden"
      >
        <ArrowLeft aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4" />
        Back to announcements
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <DetailBody id={id} />
      </Suspense>
    </AdminCard>
  );
}

async function DetailBody({ id }: { id: string }) {
  const announcement = await getAnnouncement(id);
  if (!announcement) notFound();
  const type = TYPE_META[announcement.type];
  const status = STATUS_META[announcement.status];
  const inApp = announcement.channels.includes("in-app");

  return (
    <>
      <header className="flex items-start gap-3">
        <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-admin-primary-soft text-admin-primary">
          <Megaphone strokeWidth={ICON_STROKE} className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id="announcement-title" className="text-base font-semibold text-admin-heading">
            {announcement.title}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <AdminChip tone={type.tone}>{type.label}</AdminChip>
            <AdminChip tone={status.tone} dot>
              {status.label}
            </AdminChip>
          </div>
          <p className="mt-2 text-[11px] text-admin-muted-text">
            {announcement.id} · by {announcement.createdBy} · <time dateTime={announcement.createdAt}>{formatInstant(announcement.createdAt)}</time>
          </p>
        </div>
      </header>

      <section aria-labelledby="announcement-message-title">
        <SectionTitle id="announcement-message-title">{inApp ? "Banner as staff see it" : "Message"}</SectionTitle>
        {inApp ? (
          <BannerPreview type={announcement.type} title={announcement.title} message={announcement.message} dismissible={announcement.dismissible} />
        ) : (
          <p className="rounded-[10px] bg-admin-muted px-3 py-2.5 text-[12px] leading-snug text-admin-body">{announcement.message}</p>
        )}
      </section>

      <section aria-labelledby="announcement-delivery-title">
        <SectionTitle id="announcement-delivery-title">Delivery</SectionTitle>
        <dl className="flex flex-col gap-2 text-[12.5px]">
          <Fact label="Audience">{AUDIENCE_LABELS[announcement.audience]}</Fact>
          <Fact label="Channels">{announcement.channels.map((c) => CHANNEL_LABELS[c]).join(" · ")}</Fact>
          <Fact label="Starts">
            <time dateTime={announcement.startsAt}>{formatInstant(announcement.startsAt)}</time>
          </Fact>
          <Fact label="Ends">{announcement.endsAt ? <time dateTime={announcement.endsAt}>{formatInstant(announcement.endsAt)}</time> : <Muted>When archived</Muted>}</Fact>
          {inApp ? <Fact label="Dismissible">{announcement.dismissible ? "Yes · staff can close it" : "No · stays until the window ends"}</Fact> : null}
          {announcement.archivedAt ? (
            <Fact label="Archived early">
              <time dateTime={announcement.archivedAt}>{formatInstant(announcement.archivedAt)}</time>
            </Fact>
          ) : null}
        </dl>
      </section>

      <Actions announcement={announcement} />
    </>
  );
}

function Actions({ announcement }: { announcement: Announcement }) {
  if (announcement.status === "archived") {
    return (
      <p className="rounded-[10px] bg-admin-muted px-3 py-2.5 text-[11.5px] leading-snug text-admin-muted-text">
        {announcement.archivedAt ? "Archived by an administrator before its end date." : "Expired at the end of its window."} Archived announcements cannot be edited or re-published; create a new one instead.
      </p>
    );
  }
  return (
    <section aria-labelledby="announcement-actions-title">
      <SectionTitle id="announcement-actions-title">Actions</SectionTitle>
      <div className="grid gap-2 sm:grid-cols-2">
        <EditAnnouncementDialog announcement={announcement} />
        <ArchiveAnnouncementDialog announcement={announcement} />
      </div>
    </section>
  );
}

function SectionTitle({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} className="mb-2 text-[12.5px] font-semibold text-admin-heading">
      {children}
    </h3>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-admin-muted-text">{label}</dt>
      <dd className="text-right font-medium text-admin-heading">{children}</dd>
    </div>
  );
}

function Muted({ children }: { children: ReactNode }) {
  return <span className="font-normal text-admin-muted-text">{children}</span>;
}

export function DetailPlaceholder({ className }: { className?: string }) {
  return (
    <AdminCard aria-label="Announcement detail" className={cn("min-h-[320px] flex-col items-center justify-center gap-2 text-center", className)}>
      <Megaphone aria-hidden="true" strokeWidth={ICON_STROKE} className="size-6 text-admin-icon" />
      <p className="text-[13px] font-semibold text-admin-heading">Select an announcement</p>
      <p className="max-w-[260px] text-[12px] text-admin-muted-text">The banner, audience, window and actions open here.</p>
    </AdminCard>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" className="space-y-3">
      <span className="sr-only">Loading announcement</span>
      <AdminSkeleton className="h-10 w-56" />
      <AdminSkeleton className="h-16" />
      {Array.from({ length: 5 }, (_, i) => (
        <AdminSkeleton key={i} className="h-5" />
      ))}
      <AdminSkeleton className="h-10" />
    </div>
  );
}
