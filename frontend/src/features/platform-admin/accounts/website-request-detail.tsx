import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Download, FileImage, FileText, Globe, Images, LayoutTemplate, type LucideIcon } from "lucide-react";
import { formatRelativeDateTime } from "@/lib/format/dates";
import { cn } from "@/lib/utils";
import { configurationHref } from "../configuration/search-params";
import { AdminButton, AdminCard, AdminCardHeader, AdminChip, AdminLink, AdminSkeleton } from "../components/ui";
import { ICON_STROKE } from "../sidebar-modes";
import { getWebsiteRequest, listWebsiteRequestTeam } from "../server/website-requests";
import type { WebsiteRequestAsset } from "../types";
import { companyHref, websiteRequestsHref } from "./search-params";
import { formatDateTime, WEBSITE_REQUEST_EVENT_LABELS, WEBSITE_REQUEST_STATUS_META } from "./status";
import { AddNoteDialog, AssignDialog, ChangeStatusDialog } from "./website-request-actions";

const DAY_MS = 24 * 60 * 60 * 1000;

const ASSET_ICON: Record<WebsiteRequestAsset["kind"], LucideIcon> = { logo: FileImage, photos: Images, document: FileText };

// One website request: what the Owner sent from the Back Office (left) and
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
  const [request, team] = await Promise.all([getWebsiteRequest(id), listWebsiteRequestTeam()]);
  if (!request) notFound();
  const now = new Date();
  const status = WEBSITE_REQUEST_STATUS_META[request.status];
  const dueSoon = new Date(request.dueAt).getTime() - now.getTime() < 2 * DAY_MS;
  const summary = { id: request.id, companyName: request.companyName, status: request.status, assignee: request.assignee };

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
              <AdminChip tone={status.tone} dot>
                {status.label}
              </AdminChip>
              <AdminChip tone={dueSoon ? "warning" : "neutral"}>Due {formatRelativeDateTime(request.dueAt, now)}</AdminChip>
            </div>
            <p className="mt-2 text-[11px] text-admin-muted-text">
              {request.id} · requested by {request.owner.name} · <time dateTime={request.requestedAt}>{formatDateTime(request.requestedAt)}</time>
            </p>
          </div>
        </header>

        <Section id="wr-company" title="Company and Owner">
          <dl className="grid gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-2">
            <Fact label="Company">
              <Link href={companyHref(request.companyId)} className="focus-ring rounded-sm text-admin-primary underline-offset-4 hover:underline">
                {request.companyName}
              </Link>
            </Fact>
            <Fact label="Town">{request.location}</Fact>
            <Fact label="Plan">{request.plan}</Fact>
            <Fact label="Owner">{request.owner.name}</Fact>
            <Fact label="Email">
              <a href={`mailto:${request.owner.email}`} className="focus-ring rounded-sm break-all text-admin-primary underline-offset-4 hover:underline">
                {request.owner.email}
              </a>
            </Fact>
            <Fact label="Phone">
              <a href={`tel:${request.owner.phone.replace(/\s/g, "")}`} className="focus-ring rounded-sm whitespace-nowrap text-admin-primary underline-offset-4 hover:underline">
                {request.owner.phone}
              </a>
            </Fact>
          </dl>
        </Section>

        <Section id="wr-template" title="Template and pages" action={<AdminLink href={configurationHref("templates")}>Templates</AdminLink>}>
          <div className="flex items-start gap-3 rounded-[10px] bg-admin-muted px-3 py-2.5">
            <LayoutTemplate aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-0.5 size-[18px] shrink-0 text-admin-icon" />
            <p className="text-[12.5px] text-admin-body">
              <span className="font-semibold text-admin-heading">{request.template.name}</span> · {request.template.suitedTo}
            </p>
          </div>
          <ul aria-label="Pages wanted" className="mt-3 flex flex-wrap gap-1.5">
            {request.pages.map((page) => (
              <li key={page.name}>
                <AdminChip tone={page.extra ? "info" : "neutral"}>
                  {page.name}
                  {page.extra ? <span className="font-normal"> · extra</span> : null}
                </AdminChip>
              </li>
            ))}
          </ul>
          {request.pages.some((p) => p.extra) ? <p className="mt-2 text-[11px] text-admin-muted-text">Extra pages are on top of the template&apos;s own.</p> : null}
        </Section>

        <Section id="wr-domain" title="Domain">
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded-md bg-admin-muted px-2 py-1 font-mono text-[12px] text-admin-heading">{request.domain.host}</code>
            <AdminChip tone={request.domain.kind === "custom" ? "info" : "neutral"}>{request.domain.kind === "custom" ? "Own domain" : "Sanchara subdomain"}</AdminChip>
          </div>
          <p className="mt-1.5 text-[11.5px] text-admin-muted-text">{request.domain.note}</p>
        </Section>

        <Section id="wr-properties" title="Properties to include">
          <ul className="flex flex-col gap-1.5">
            {request.properties.map((name) => (
              <li key={name} className="flex items-center gap-2 text-[12.5px] text-admin-heading">
                <Building2 aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4 shrink-0 text-admin-icon" />
                {name}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="wr-assets" title="Brand assets">
          <ul className="divide-y divide-admin-border rounded-[10px] border border-admin-border">
            {request.assets.map((asset) => {
              const Icon = ASSET_ICON[asset.kind];
              return (
                <li key={asset.name} className="flex items-center gap-3 px-3 py-2.5">
                  <Icon aria-hidden="true" strokeWidth={ICON_STROKE} className="size-5 shrink-0 text-admin-icon" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-[12px] text-admin-heading">{asset.name}</span>
                    <span className="block text-[11px] text-admin-muted-text">{asset.detail}</span>
                  </span>
                  <AdminButton icon={Download} placeholder className="h-8 px-2.5 text-[12px]">
                    Download<span className="sr-only"> {asset.name}</span>
                  </AdminButton>
                </li>
              );
            })}
          </ul>
          <div className="mt-3">
            <p className="mb-1.5 text-[11px] font-medium text-admin-muted-text">Brand colours</p>
            {request.colours.length === 0 ? (
              <p className="text-[12px] text-admin-body">None sent; use the template&apos;s colours.</p>
            ) : (
              <ul className="flex flex-wrap gap-3">
                {request.colours.map((hex) => (
                  <li key={hex} className="flex items-center gap-2">
                    {/* Owner content, not a console colour: no admin token applies. */}
                    <span aria-hidden="true" className="size-7 rounded-md border border-admin-border" style={{ backgroundColor: hex }} />
                    <code className="font-mono text-[12px] text-admin-heading">{hex}</code>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>

        <Section id="wr-notes" title="Owner's notes">
          <blockquote className="rounded-[10px] border-l-[3px] border-admin-primary bg-admin-muted px-3 py-2.5 text-[12.5px] leading-relaxed text-admin-body">{request.ownerNotes}</blockquote>
        </Section>
      </AdminCard>

      <div className="flex flex-col gap-4">
        <AdminCard aria-labelledby="wr-work-title" className="flex flex-col gap-4">
          <AdminCardHeader id="wr-work-title" title="Work" className="mb-0" />
          <dl className="flex flex-col gap-2 text-[12.5px]">
            <Fact label="Status" inline>
              <AdminChip tone={status.tone} dot>
                {status.label}
              </AdminChip>
            </Fact>
            <Fact label="Assigned to" inline>
              {request.assignee ? request.assignee.name : <span className="font-normal text-admin-muted-text">Unassigned</span>}
            </Fact>
            <Fact label="Due" inline>
              <time dateTime={request.dueAt} className={cn(dueSoon && "text-admin-warning")}>
                {formatDateTime(request.dueAt)}
              </time>
            </Fact>
          </dl>
          <p className="text-[11.5px] text-admin-muted-text">{status.description}</p>
          <div className="grid gap-2">
            <ChangeStatusDialog request={summary} />
            <AssignDialog request={summary} team={team} />
            <AddNoteDialog request={summary} />
          </div>
        </AdminCard>

        <AdminCard aria-labelledby="wr-timeline-title">
          <AdminCardHeader id="wr-timeline-title" title="Timeline" />
          <ol className="flex flex-col">
            {request.timeline.map((event, i) => (
              <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
                {i < request.timeline.length - 1 ? <span aria-hidden="true" className="absolute top-3 left-[5px] h-full w-px bg-admin-border" /> : null}
                <span aria-hidden="true" className={cn("relative mt-1 size-[11px] shrink-0 rounded-full border-2 border-admin-card", i === 0 ? "bg-admin-primary" : "bg-admin-border")} />
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-admin-heading">{WEBSITE_REQUEST_EVENT_LABELS[event.kind]}</p>
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
            <p className="text-[12px] text-admin-muted-text">No notes yet.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {request.internalNotes.map((note) => (
                <li key={note.id} className="rounded-[10px] bg-admin-muted px-3 py-2.5">
                  <p className="text-[12px] leading-snug text-admin-body">{note.text}</p>
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

function Section({ id, title, action, children }: { id: string; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 id={id} className="text-[12.5px] font-semibold text-admin-heading">
          {title}
        </h3>
        {action}
      </div>
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
      <AdminSkeleton className="h-[720px] rounded-[14px]" />
      <div className="flex flex-col gap-4">
        <AdminSkeleton className="h-[260px] rounded-[14px]" />
        <AdminSkeleton className="h-[220px] rounded-[14px]" />
      </div>
    </div>
  );
}
