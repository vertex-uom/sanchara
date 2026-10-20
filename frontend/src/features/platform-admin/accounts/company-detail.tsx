import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban, Building2, CreditCard, Globe, RotateCcw, ShieldAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import { formatDateOnly, formatRelativeDateTime } from "@/lib/format/dates";
import { cn } from "@/lib/utils";
import { AdminButtonLink, AdminCard, AdminChip, AdminLink, AdminSkeleton } from "../components/ui";
import { adminNavItem } from "../nav";
import { ICON_STROKE } from "../sidebar-modes";
import { getCompany } from "../server/accounts";
import type { CompanyAccountDetail, CompanyFilters, EnforcementEntry, EnforcementKind } from "../types";
import { ReactivateDialog, SuspendDialog } from "./enforcement-actions";
import { companiesHref, websiteBuildHref } from "./search-params";
import { COMPANY_STATUS_META, ENFORCEMENT_KIND_META, SUBSCRIPTION_STATE_META } from "./status";

// Right-hand detail panel (400px in the design). Sections are stacked:
// Company, Subscription, Properties & staff, Enforcement history, then the
// enforcement actions allowed for the company's current status.
export function CompanyDetail({ id, filters }: { id: string; filters: CompanyFilters }) {
  return (
    <AdminCard aria-labelledby="company-title" className="flex flex-col gap-5">
      <Link
        href={companiesHref(filters)}
        className="focus-ring -mb-2 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-md text-xs font-medium text-admin-primary underline-offset-4 hover:underline xl:hidden"
      >
        <ArrowLeft aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4" />
        Back to companies
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <DetailBody id={id} />
      </Suspense>
    </AdminCard>
  );
}

async function DetailBody({ id }: { id: string }) {
  const company = await getCompany(id);
  if (!company) notFound();
  const now = new Date();
  const status = COMPANY_STATUS_META[company.status];
  const subscription = SUBSCRIPTION_STATE_META[company.subscription.state];
  const staffTotal = company.staff.owners + company.staff.managers + company.staff.frontDesk;

  return (
    <>
      <header>
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 id="company-title" className="text-base font-semibold text-admin-heading">
            {company.name}
          </h2>
          <AdminChip tone={status.tone} dot>
            {status.label}
          </AdminChip>
        </div>
        <p className="mt-2.5 text-[11px] text-admin-muted-text">
          {company.id} · {company.location} · Joined <time dateTime={company.joinedAt}>{formatDateOnly(company.joinedAt)}</time>
        </p>
      </header>

      <section aria-labelledby="company-facts-title">
        <SectionTitle id="company-facts-title">Company</SectionTitle>
        <dl className="flex flex-col gap-2 text-[12.5px]">
          <Fact label="Legal name">{company.legalName}</Fact>
          <Fact label="Registration no.">{company.registrationNo}</Fact>
          <Fact label="Owner">{company.ownerName}</Fact>
          <Fact label="Contact">{company.contact}</Fact>
          <Fact label="Website">
            {company.siteHosts.map((host) => (
              <span key={host} className="block">
                {host}
              </span>
            ))}
          </Fact>
        </dl>
      </section>

      <section aria-labelledby="company-subscription-title">
        <SectionTitle id="company-subscription-title">Subscription</SectionTitle>
        <div className="flex items-start gap-3 rounded-[10px] bg-admin-muted px-3 py-2.5">
          <CreditCard aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-px size-5 shrink-0 text-admin-icon" />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-[12.5px] font-semibold text-admin-heading">
              {company.plan} plan
              <AdminChip tone={subscription.tone}>{subscription.label}</AdminChip>
            </p>
            <p className="mt-0.5 text-[11px] text-admin-muted-text">{company.subscription.detail}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="company-properties-title">
        <SectionTitle id="company-properties-title">Properties &amp; staff</SectionTitle>
        <ul className="mb-2.5 flex flex-col">
          {company.properties.map((property) => (
            <li key={property} className="flex min-h-10 items-center gap-3 border-b border-admin-border py-1.5 text-[12.5px] font-medium text-admin-heading last:border-b-0">
              <Building2 aria-hidden="true" strokeWidth={ICON_STROKE} className="size-[18px] shrink-0 text-admin-icon" />
              {property}
            </li>
          ))}
        </ul>
        <p className="text-[11.5px] text-admin-muted-text">
          {staffTotal} staff · {company.staff.owners} owner · {company.staff.managers} {company.staff.managers === 1 ? "manager" : "managers"} · {company.staff.frontDesk} front desk
        </p>
      </section>

      {company.websiteRequestId ? (
        <p className="flex items-center gap-2.5 rounded-[10px] bg-admin-info-soft px-3 py-2.5 text-[11.5px] leading-snug text-admin-info">
          <Globe aria-hidden="true" strokeWidth={ICON_STROKE} className="size-[18px] shrink-0" />
          <span className="flex-1 font-semibold">Website build requested.</span>
          <AdminLink href={websiteBuildHref(company.id)} srContext={`for ${company.name}`}>
            Build website
          </AdminLink>
        </p>
      ) : null}

      <section aria-labelledby="company-history-title">
        <SectionTitle id="company-history-title">Enforcement history</SectionTitle>
        {company.history.length === 0 ? (
          <p className="text-[12px] text-admin-muted-text">No enforcement actions for this company.</p>
        ) : (
          <History entries={company.history} now={now} />
        )}
      </section>

      <Actions company={company} />
    </>
  );
}

// Which action applies follows the company status machine. Non-payment
// suspensions are lifted by payment, so there is nothing to click here.
function Actions({ company }: { company: CompanyAccountDetail }) {
  switch (company.status) {
    case "active":
      return (
        <div role="group" aria-label="Enforcement actions">
          <SuspendDialog company={company} />
        </div>
      );
    case "suspended-admin":
      return (
        <div role="group" aria-label="Enforcement actions">
          <ReactivateDialog company={company} />
        </div>
      );
    case "suspended-nonpayment":
      return (
        <div className="flex flex-col gap-2.5 rounded-[10px] bg-admin-warning-soft px-3 py-2.5 text-[11.5px] leading-snug text-admin-warning">
          <p className="flex items-start gap-2">
            <TriangleAlert aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-px size-[18px] shrink-0" />
            <span>
              <span className="font-semibold">Suspended for non-payment.</span> This suspension lifts automatically when the subscription is paid. Manual
              reactivation is not available.
            </span>
          </p>
          <AdminButtonLink href={adminNavItem("finance").href} icon={CreditCard} className="w-fit">
            Open Financial Operations
          </AdminButtonLink>
        </div>
      );
    case "pending":
      return (
        <p className="rounded-[10px] bg-admin-muted px-3 py-2.5 text-[11.5px] leading-snug text-admin-muted-text">
          The owner has not finished setting up this company yet. Enforcement actions become available once it is active.
        </p>
      );
  }
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

const KIND_ICONS: Record<EnforcementKind, LucideIcon> = {
  suspended: Ban,
  "suspended-nonpayment": CreditCard,
  reactivated: RotateCcw,
  "reactivated-payment": RotateCcw,
  warning: ShieldAlert,
};

function History({ entries, now }: { entries: EnforcementEntry[]; now: Date }) {
  return (
    <ol className="flex flex-col">
      {entries.map((entry) => {
        const Icon = KIND_ICONS[entry.kind];
        const meta = ENFORCEMENT_KIND_META[entry.kind];
        return (
          <li key={entry.id} className="flex min-h-[50px] items-start gap-3 border-b border-admin-border py-2 last:border-b-0">
            <Icon aria-hidden="true" strokeWidth={ICON_STROKE} className={cn("mt-0.5 size-5 shrink-0", entry.critical ? "text-admin-danger" : "text-admin-icon")} />
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-admin-heading">
                {meta.label}
                {entry.critical ? <span className="sr-only"> (critical)</span> : null}
              </p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-admin-body">{entry.reason}</p>
              <p className="mt-0.5 text-[11px] text-admin-muted-text">
                {entry.actor} · <time dateTime={entry.occurredAt}>{formatRelativeDateTime(entry.occurredAt, now)}</time>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// Shown beside the list on wide screens while nothing is selected.
export function DetailPlaceholder({ className }: { className?: string }) {
  return (
    <AdminCard aria-label="Company detail" className={cn("min-h-[320px] flex-col items-center justify-center gap-2 text-center", className)}>
      <Building2 aria-hidden="true" strokeWidth={ICON_STROKE} className="size-6 text-admin-icon" />
      <p className="text-[13px] font-semibold text-admin-heading">Select a company</p>
      <p className="max-w-[260px] text-[12px] text-admin-muted-text">Its subscription, properties, enforcement history and actions open here.</p>
    </AdminCard>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" className="space-y-3">
      <span className="sr-only">Loading company</span>
      <AdminSkeleton className="h-6 w-48" />
      <AdminSkeleton className="h-10" />
      {Array.from({ length: 6 }, (_, i) => (
        <AdminSkeleton key={i} className="h-5" />
      ))}
      <AdminSkeleton className="h-32" />
    </div>
  );
}
