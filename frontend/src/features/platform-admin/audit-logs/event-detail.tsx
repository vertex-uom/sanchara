import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink, FileText, Filter, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format/dates";
import { AdminButtonLink, AdminCard, AdminChip, AdminSkeleton } from "../components/ui";
import { ICON_STROKE } from "../sidebar-modes";
import { getAuditEvent } from "../server/audit";
import type { AuditFilters } from "../types";
import { auditLogsHref } from "./search-params";
import { CATEGORY_META } from "./status";

// Right-hand detail panel: what happened, who did it, from where, what
// changed. Two links instead of the design's trace buttons: filter the log
// by this actor, and open the target.
export function EventDetail({ id, filters }: { id: string; filters: AuditFilters }) {
  return (
    <AdminCard aria-labelledby="audit-event-title" className="flex flex-col gap-5">
      <Link href={auditLogsHref(filters)} className="focus-ring -mb-2 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-md text-xs font-medium text-admin-primary underline-offset-4 hover:underline xl:hidden">
        <ArrowLeft aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4" />
        Back to the event log
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <DetailBody id={id} filters={filters} />
      </Suspense>
    </AdminCard>
  );
}

async function DetailBody({ id, filters }: { id: string; filters: AuditFilters }) {
  const event = await getAuditEvent(id);
  if (!event) notFound();
  const category = CATEGORY_META[event.category];
  const Icon = event.critical ? TriangleAlert : category.icon;
  const canFilterByActor = event.actor.id !== "unknown" && filters.actor !== event.actor.id;

  return (
    <>
      <header className="flex items-start gap-3">
        <span aria-hidden="true" className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-full", event.critical ? "bg-admin-danger-soft text-admin-danger" : "bg-admin-primary-soft text-admin-primary")}>
          <Icon strokeWidth={ICON_STROKE} className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id="audit-event-title" className="text-base font-semibold text-admin-heading">
            {event.action}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <AdminChip tone="neutral">{category.label}</AdminChip>
            {event.critical ? (
              <AdminChip tone="danger" dot>
                Critical
              </AdminChip>
            ) : null}
            {event.failed ? <AdminChip tone="danger">Failed</AdminChip> : null}
          </div>
          <p className="mt-2 text-[11px] text-admin-muted-text">
            {event.id} · <time dateTime={event.at}>{formatDateTime(event.at)}</time>
          </p>
        </div>
      </header>

      <section aria-labelledby="audit-event-facts-title">
        <SectionTitle id="audit-event-facts-title">Details</SectionTitle>
        <dl className="flex flex-col gap-2 text-[12.5px]">
          <Fact label="Actor">
            {event.actor.name}
            {event.actor.email ? <span className="block text-[11px] font-normal text-admin-muted-text">{event.actor.email}</span> : null}
          </Fact>
          <Fact label="Target">{event.target ? event.target.href ? <Link href={event.target.href} className="focus-ring rounded-sm text-admin-primary underline-offset-4 hover:underline">{event.target.label}</Link> : event.target.label : <Muted>None</Muted>}</Fact>
          <Fact label="IP address">{event.ip ?? <Muted>Automatic</Muted>}</Fact>
          {event.note ? <Fact label={event.failed ? "Reason" : "Note"}>{event.note}</Fact> : null}
        </dl>
      </section>

      {event.changes.length > 0 ? (
        <section aria-labelledby="audit-event-changes-title">
          <SectionTitle id="audit-event-changes-title">Changes (before → after)</SectionTitle>
          <ul className="flex flex-col gap-1.5 rounded-[10px] bg-admin-muted px-3 py-2.5 text-[12px]">
            {event.changes.map((change) => (
              <li key={change.field} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <span className="font-medium text-admin-heading">{change.field}</span>
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <span className={change.before === null ? "text-admin-muted-text" : "text-admin-danger line-through decoration-admin-danger/50"}>{change.before ?? "—"}</span>
                  <ArrowRight aria-hidden="true" strokeWidth={ICON_STROKE} className="size-3.5 text-admin-muted-text" />
                  <span className="sr-only">to</span>
                  <span className="font-medium text-admin-success">{change.after ?? "—"}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="audit-event-actions-title">
        <SectionTitle id="audit-event-actions-title">Follow</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-2">
          {canFilterByActor ? <AdminButtonLink icon={Filter} href={auditLogsHref({ ...filters, actor: event.actor.id, page: 1 })}>Filter by this actor</AdminButtonLink> : null}
          {event.target?.href ? <AdminButtonLink icon={ExternalLink} href={event.target.href}>Open {event.target.kind === "company" ? "company" : event.target.kind === "admin-user" ? "admin users" : event.target.kind === "website-request" ? "request" : "target"}</AdminButtonLink> : null}
          {!canFilterByActor && !event.target?.href ? <p className="text-[11.5px] text-admin-muted-text sm:col-span-2">Nothing further to open for this event.</p> : null}
        </div>
      </section>
    </>
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
    <AdminCard aria-label="Event detail" className={cn("min-h-[320px] flex-col items-center justify-center gap-2 text-center", className)}>
      <FileText aria-hidden="true" strokeWidth={ICON_STROKE} className="size-6 text-admin-icon" />
      <p className="text-[13px] font-semibold text-admin-heading">Select an event</p>
      <p className="max-w-[260px] text-[12px] text-admin-muted-text">Who did it, from where, and what changed open here.</p>
    </AdminCard>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <span className="sr-only">Loading event</span>
      <AdminSkeleton className="h-16" />
      <AdminSkeleton className="h-28" />
      <AdminSkeleton className="h-20" />
    </div>
  );
}
