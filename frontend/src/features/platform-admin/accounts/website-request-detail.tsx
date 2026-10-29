import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Globe } from "lucide-react";
import { ASSISTANCE_GOALS, ASSISTANCE_STYLES, ASSISTANCE_TIMINGS, CONTACT_METHODS, labelOf } from "@/features/website-builder";
import { DAY_MS, formatDateTime, formatRelativeDateTime } from "@/lib/format/dates";
import { cn } from "@/lib/utils";
import { AdminCard, AdminCardHeader, AdminChip, AdminSkeleton } from "../components/ui";
import { ICON_STROKE } from "../sidebar-modes";
import { getWebsiteRequest } from "../server/website-requests";
import type { WebsiteRequestStatus } from "../types";
import { websiteRequestsHref } from "./search-params";
import { WEBSITE_REQUEST_EVENT_LABELS, WEBSITE_REQUEST_STATE_META } from "./status";
import { AddNoteDialog, AssignDialog, ChangeStatusDialog } from "./website-request-actions";

const ROLE_LABELS = { owner: "Owner", manager: "Manager", "front-desk": "Front Desk" } as const;

// One website request: what the company sent from the Back Office (left) and
// the team's work on it (right): status, assignee, timeline, internal notes.
export function WebsiteRequestDetail({ id }: { id: string }) {
  return (
    <div className="flex flex-col gap-4">
      <Link href={websiteRequestsHref()} className="focus-ring -mb-1 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-md text-xs font-medium text-admin-primary underline-offset-4 hover:underline sm:min-h-0">
        <ArrowLeft aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4" />
        Back to website requests
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <DetailBody id={id} />
      </Suspense>
    </div>
  );
}

async function DetailBody({ id }: { id: string }) {
  const request = await getWebsiteRequest(id);
  if (!request) notFound();
  const now = new Date();
  const state = WEBSITE_REQUEST_STATE_META[request.status];
  const open = request.status !== "published" && request.status !== "cancelled";
  const dueSoon = open && request.dueAt !== null && new Date(request.dueAt).getTime() - now.getTime() < 2 * DAY_MS;
  const summary = { id: request.id, reference: request.reference, companyName: request.companyName, status: request.status as WebsiteRequestStatus, assignee: request.assignee };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 xl:grid-cols-[minmax(0,704fr)_minmax(0,400fr)]">
      <AdminCard aria-labelledby="website-request-title" className="flex flex-col gap-6">
        <header className="flex items-start gap-3">
          <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-admin-primary-soft text-admin-primary">
            <Globe strokeWidth={ICON_STROKE} className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 id="website-request-title" className="text-base font-semibold text-admin-heading">
              Website for {request.companyName}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <AdminChip tone={state.tone} dot>
                {state.label}
              </AdminChip>
              {open && request.dueAt ? <AdminChip tone={dueSoon ? "warning" : "neutral"}>Due {formatRelativeDateTime(request.dueAt, now)}</AdminChip> : null}
            </div>
            <p className="mt-2 text-[11px] text-admin-muted-text">
              {request.reference}
              {request.requestedBy ? ` · requested by ${request.requestedBy.name} (${ROLE_LABELS[request.requestedBy.role]})` : ""} ·{" "}
              <time dateTime={request.requestedAt}>{formatDateTime(request.requestedAt)}</time>
            </p>
          </div>
        </header>

        <Section id="wr-company" title="Company and contact">
          <dl className="grid gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-2">
            <Fact label="Company">{request.companyName}</Fact>
            <Fact label="Town">{request.location || "—"}</Fact>
            <Fact label="Plan">{request.plan ?? "—"}</Fact>
            <Fact label="Contact">{request.contact.name}</Fact>
            <Fact label="Email">
              <a href={`mailto:${request.contact.email}`} className="focus-ring rounded-sm break-all text-admin-primary underline-offset-4 hover:underline">
                {request.contact.email}
              </a>
            </Fact>
            <Fact label="Phone">
              <a href={`tel:${request.contact.phone.replace(/[\s()-]/g, "")}`} className="focus-ring rounded-sm whitespace-nowrap text-admin-primary underline-offset-4 hover:underline">
                {request.contact.phone}
              </a>
            </Fact>
            <Fact label="Reach by">{labelOf(CONTACT_METHODS, request.contact.method)}</Fact>
          </dl>
        </Section>

        <Section id="wr-wants" title="What they want">
          <ul aria-label="Goals" className="flex flex-wrap gap-1.5">
            {request.goals.length === 0 ? <li className="text-xs text-admin-muted-text">No goals chosen.</li> : null}
            {request.goals.map((goal) => (
              <li key={goal}>
                <AdminChip tone="info">{labelOf(ASSISTANCE_GOALS, goal)}</AdminChip>
              </li>
            ))}
          </ul>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-2">
            <Fact label="Style">{labelOf(ASSISTANCE_STYLES, request.style)}</Fact>
            <Fact label="Needed by">{labelOf(ASSISTANCE_TIMINGS, request.timing)}</Fact>
          </dl>
        </Section>

        {request.property ? (
          <Section id="wr-property" title="Property">
            <p className="flex items-center gap-2 text-[12.5px] text-admin-heading">
              <Building2 aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4 shrink-0 text-admin-icon" />
              {request.property.name}
            </p>
          </Section>
        ) : null}

        <Section id="wr-notes" title="Notes from the company">
          {request.notes ? (
            <blockquote className="rounded-[10px] border-l-[3px] border-admin-primary bg-admin-muted px-3 py-2.5 text-[12.5px] leading-relaxed whitespace-pre-line text-admin-body">
              {request.notes}
            </blockquote>
          ) : (
            <p className="text-xs text-admin-muted-text">None.</p>
          )}
        </Section>
      </AdminCard>

      <div className="flex flex-col gap-4">
        <AdminCard aria-labelledby="wr-work-title" className="flex flex-col gap-4">
          <AdminCardHeader id="wr-work-title" title="Work" className="mb-0" />
          <dl className="flex flex-col gap-2 text-[12.5px]">
            <Fact label="Status" inline>
              <AdminChip tone={state.tone} dot>
                {state.label}
              </AdminChip>
            </Fact>
            <Fact label="Assigned to" inline>
              {request.assignee ? request.assignee.name : <span className="font-normal text-admin-muted-text">Unassigned</span>}
            </Fact>
            <Fact label={open ? "Due" : "Closed"} inline>
              {open ? (
                request.dueAt ? (
                  <time dateTime={request.dueAt} className={cn(dueSoon && "text-admin-warning")}>
                    {formatDateTime(request.dueAt)}
                  </time>
                ) : (
                  <span className="font-normal text-admin-muted-text">No rush</span>
                )
              ) : request.closedAt ? (
                <time dateTime={request.closedAt}>{formatDateTime(request.closedAt)}</time>
              ) : (
                "—"
              )}
            </Fact>
          </dl>
          <p className="text-[11.5px] text-admin-muted-text">{state.description}</p>
          <div className="grid gap-2">
            {open ? (
              <>
                <ChangeStatusDialog request={summary} />
                <AssignDialog request={summary} team={request.team} />
              </>
            ) : null}
            <AddNoteDialog request={summary} />
          </div>
        </AdminCard>

        <AdminCard aria-labelledby="wr-timeline-title">
          <AdminCardHeader id="wr-timeline-title" title="Timeline" />
          <ol className="flex flex-col">
            {request.timeline.map((event, i) => (
              <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
                {i < request.timeline.length - 1 ? <span aria-hidden="true" className="absolute top-3 left-1.25 h-full w-px bg-admin-border" /> : null}
                <span aria-hidden="true" className={cn("relative mt-1 size-2.75 shrink-0 rounded-full border-2 border-admin-card", i === 0 ? "bg-admin-primary" : "bg-admin-border")} />
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-admin-heading">
                    {event.kind === "status-changed" && event.status ? `Moved to ${WEBSITE_REQUEST_STATE_META[event.status].label}` : WEBSITE_REQUEST_EVENT_LABELS[event.kind]}
                  </p>
                  {event.note ? <p className="text-[11.5px] text-admin-body">{event.note}</p> : null}
                  <p className="mt-0.5 text-[11px] text-admin-muted-text">
                    {event.actor} · <time dateTime={event.at}>{formatRelativeDateTime(event.at, now)}</time>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </AdminCard>

        <AdminCard aria-labelledby="wr-internal-title">
          <AdminCardHeader id="wr-internal-title" title="Internal notes" chip={<AdminChip tone="neutral">{request.internalNotes.length}</AdminChip>} />
          {request.internalNotes.length === 0 ? (
            <p className="text-xs text-admin-muted-text">No notes yet.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {request.internalNotes.map((note) => (
                <li key={note.id} className="rounded-[10px] bg-admin-muted px-3 py-2.5">
                  <p className="text-xs leading-snug whitespace-pre-line text-admin-body">{note.text}</p>
                  <p className="mt-1 text-[11px] text-admin-muted-text">
                    {note.author} · <time dateTime={note.at}>{formatRelativeDateTime(note.at, now)}</time>
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[11px] text-admin-muted-text">Only the platform team sees these.</p>
        </AdminCard>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h3 id={id} className="mb-2 text-[12.5px] font-semibold text-admin-heading">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Fact({ label, inline = false, children }: { label: string; inline?: boolean; children: ReactNode }) {
  return (
    <div className={cn("flex min-w-0 gap-4", inline ? "items-center justify-between" : "items-baseline justify-between sm:justify-start")}>
      <dt className={cn("shrink-0 text-admin-muted-text", !inline && "sm:w-16")}>{label}</dt>
      <dd className={cn("min-w-0 text-right font-medium text-admin-heading", !inline && "sm:text-left")}>{children}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 xl:grid-cols-[minmax(0,704fr)_minmax(0,400fr)]">
      <span className="sr-only">Loading website request</span>
      <AdminSkeleton className="h-180 rounded-[14px]" />
      <div className="flex flex-col gap-4">
        <AdminSkeleton className="h-65 rounded-[14px]" />
        <AdminSkeleton className="h-55 rounded-[14px]" />
      </div>
    </div>
  );
}
