import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCheck, Clock, FileText, Inbox, Lock, MessageSquareMore, CirclePause, Search, ShieldCheck, CircleX, type LucideIcon } from "lucide-react";
import { formatRelativeDateTime } from "@/lib/format/dates";
import { cn } from "@/lib/utils";
import { AdminCard, AdminChip, AdminSkeleton } from "../components/ui";
import { ICON_STROKE } from "../sidebar-modes";
import { getApplication, isOpenApplication } from "../server/onboarding";
import type { ApplicationFilters, ApplicationTimelineEntry } from "../types";
import { DocumentViewerDialog } from "./document-viewer-dialog";
import { ReviewActions } from "./review-actions";
import { applicationsHref } from "./search-params";
import { APPLICATION_STATUS_META, DOCUMENT_STATUS_META } from "./status";

// Right-hand detail panel (400px in the design). Sections are stacked rather
// than tabbed: Applicant & business, Documents, internal note, Activity &
// messages, then the review actions.
export function ApplicationDetail({ id, filters }: { id: string; filters: ApplicationFilters }) {
  return (
    <AdminCard aria-labelledby="application-title" className="flex flex-col gap-5">
      <Link
        href={applicationsHref(filters)}
        className="focus-ring -mb-2 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-md text-xs font-medium text-admin-primary underline-offset-4 hover:underline xl:hidden"
      >
        <ArrowLeft aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4" />
        Back to applications
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <DetailBody id={id} />
      </Suspense>
    </AdminCard>
  );
}

async function DetailBody({ id }: { id: string }) {
  const application = await getApplication(id);
  if (!application) notFound();
  const now = new Date();
  const status = APPLICATION_STATUS_META[application.status];

  return (
    <>
      <header>
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 id="application-title" className="text-base font-semibold text-admin-heading">
            {application.reference}
          </h2>
          <AdminChip tone={status.tone} dot>
            {status.label}
          </AdminChip>
        </div>
        <p className="mt-2.5 text-[12.5px] font-semibold text-admin-heading">{application.businessName}</p>
        <p className="mt-0.5 text-[11px] text-admin-muted-text">
          {application.region} · {application.businessType} · Submitted {formatDateTime(application.submittedAt)}
        </p>
      </header>

      <section aria-labelledby="application-facts-title">
        <SectionTitle id="application-facts-title">Applicant &amp; business</SectionTitle>
        <dl className="flex flex-col gap-2 text-[12.5px]">
          <Fact label="Applicant">{application.applicantName}</Fact>
          <Fact label="Legal name">{application.legalName}</Fact>
          <Fact label="Registration no.">{application.registrationNo}</Fact>
          <Fact label="Tax ID">{application.taxId}</Fact>
          <Fact label="Address">{application.address}</Fact>
          <Fact label="Contact">{application.contact}</Fact>
          <Fact label="Properties declared">
            {application.propertiesDeclared.length} · {application.propertiesDeclared.join(", ")}
          </Fact>
        </dl>
      </section>

      <section aria-labelledby="application-documents-title">
        <SectionTitle id="application-documents-title">Documents</SectionTitle>
        <ul>
          {application.documents.map((document) => {
            const meta = DOCUMENT_STATUS_META[document.status];
            return (
              <li key={document.id} className="border-b border-admin-border last:border-b-0">
                <DocumentViewerDialog document={document} businessName={application.businessName}>
                  <button
                    type="button"
                    className="focus-ring flex min-h-[50px] w-full items-center gap-3 rounded-md py-2 text-left transition-colors hover:bg-admin-muted/60 motion-reduce:transition-none"
                  >
                    <FileText aria-hidden="true" strokeWidth={ICON_STROKE} className="size-5 shrink-0 text-admin-icon" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-semibold text-admin-heading">{document.name}</span>
                      <span className="mt-0.5 block text-[11px] text-admin-muted-text">{document.detail}</span>
                    </span>
                    <AdminChip tone={meta.tone} dot>
                      {meta.label}
                    </AdminChip>
                  </button>
                </DocumentViewerDialog>
              </li>
            );
          })}
        </ul>
      </section>

      {application.internalNote ? (
        <p className="flex items-start gap-2.5 rounded-[10px] bg-admin-warning-soft px-3 py-2.5 text-[11.5px] leading-snug text-admin-warning">
          <Lock aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-px size-[18px] shrink-0" />
          <span>
            <span className="font-semibold">Internal note (not visible to applicant):</span> {application.internalNote}
          </span>
        </p>
      ) : null}

      <section aria-labelledby="application-activity-title">
        <SectionTitle id="application-activity-title">Activity &amp; messages</SectionTitle>
        <Timeline entries={application.timeline} now={now} />
      </section>

      {isOpenApplication(application.status) ? (
        <ReviewActions application={application} />
      ) : (
        <p className="rounded-[10px] bg-admin-muted px-3 py-2.5 text-[11.5px] text-admin-muted-text">
          Decision made on {formatDateTime(application.timeline.at(-1)?.occurredAt ?? application.submittedAt)}. Decided applications are read-only.
        </p>
      )}
    </>
  );
}

function SectionTitle({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} className="mb-2.5 text-[13px] font-semibold text-admin-heading">
      {children}
    </h3>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-admin-muted-text">{label}</dt>
      <dd className="text-right font-medium break-words text-admin-heading">{children}</dd>
    </div>
  );
}

const EVENT_ICONS: { match: RegExp; icon: LucideIcon }[] = [
  { match: /submitted/i, icon: Inbox },
  { match: /approved/i, icon: CheckCheck },
  { match: /rejected/i, icon: CircleX },
  { match: /hold/i, icon: CirclePause },
  { match: /more info/i, icon: MessageSquareMore },
  { match: /review/i, icon: Search },
  { match: /document/i, icon: ShieldCheck },
];

function eventIcon(title: string) {
  return EVENT_ICONS.find((entry) => entry.match.test(title))?.icon ?? Clock;
}

function Timeline({ entries, now }: { entries: ApplicationTimelineEntry[]; now: Date }) {
  return (
    <ol className="flex flex-col">
      {entries.map((entry) => {
        if (entry.kind === "event") {
          const Icon = eventIcon(entry.title);
          return (
            <li key={entry.id} className="flex min-h-[50px] items-center gap-3 border-b border-admin-border py-2 last:border-b-0">
              <Icon aria-hidden="true" strokeWidth={ICON_STROKE} className="size-5 shrink-0 text-admin-icon" />
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold text-admin-heading">{entry.title}</p>
                <p className="mt-0.5 text-[11px] text-admin-muted-text">
                  {entry.actor} · <time dateTime={entry.occurredAt}>{formatRelativeDateTime(entry.occurredAt, now)}</time>
                </p>
              </div>
            </li>
          );
        }
        const reviewer = entry.authorRole === "reviewer";
        return (
          <li key={entry.id} className="flex items-start gap-3 border-b border-admin-border py-2.5 last:border-b-0">
            <span
              aria-hidden="true"
              className={cn(
                "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                reviewer ? "bg-admin-primary-soft text-admin-primary" : "bg-admin-muted text-admin-body",
              )}
            >
              {initials(entry.author)}
            </span>
            <div className={cn("min-w-0 flex-1 rounded-[10px] px-3 py-2.5", reviewer ? "bg-admin-primary-soft" : "bg-admin-muted")}>
              <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-[12.5px] font-semibold text-admin-heading">{entry.author}</span>
                <time dateTime={entry.occurredAt} className="text-[11px] text-admin-muted-text">
                  {formatRelativeDateTime(entry.occurredAt, now)}
                </time>
              </p>
              <p className="mt-1 text-[12.5px] leading-snug text-admin-body">{entry.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// "Kamala Silva (Reviewer)" → "KS"
function initials(name: string) {
  return name
    .replace(/\(.*\)/, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

// "21 Oct 2026, 10:24 AM" in Sri Lanka time.
function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Colombo",
  })
    .format(new Date(iso))
    .replace(/\b(am|pm)\b/, (m) => m.toUpperCase());
}

// Shown beside the list on wide screens while nothing is selected.
export function DetailPlaceholder({ className }: { className?: string }) {
  return (
    <AdminCard aria-label="Application detail" className={cn("min-h-[320px] flex-col items-center justify-center gap-2 text-center", className)}>
      <FileText aria-hidden="true" strokeWidth={ICON_STROKE} className="size-6 text-admin-icon" />
      <p className="text-[13px] font-semibold text-admin-heading">Select an application</p>
      <p className="max-w-[260px] text-[12px] text-admin-muted-text">Its details, documents and messages open here. Use &ldquo;Review next&rdquo; to start with the oldest one.</p>
    </AdminCard>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" className="space-y-3">
      <span className="sr-only">Loading application</span>
      <AdminSkeleton className="h-6 w-48" />
      <AdminSkeleton className="h-10" />
      {Array.from({ length: 7 }, (_, i) => (
        <AdminSkeleton key={i} className="h-5" />
      ))}
      <AdminSkeleton className="h-40" />
    </div>
  );
}

