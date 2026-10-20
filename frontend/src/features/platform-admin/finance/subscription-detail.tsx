import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, CircleAlert, CreditCard, Receipt, TriangleAlert } from "lucide-react";
import { formatDate, formatDateOnly } from "@/lib/format/dates";
import { formatMoney } from "@/lib/format/money";
import { cn } from "@/lib/utils";
import { AdminCard, AdminChip, AdminLink, AdminSkeleton } from "../components/ui";
import { adminNavItem } from "../nav";
import { ICON_STROKE } from "../sidebar-modes";
import { getSubscription } from "../server/finance";
import type { CompanySubscriptionDetail, SubscriptionFilters } from "../types";
import { subscriptionsHref } from "./search-params";
import { daysFromToday, describeDays, INVOICE_STATUS_META, ordinal, SUBSCRIPTION_STATUS_META, todayKey } from "./status";

// Right-hand detail panel (400px in the design). Read-only: payment lifts a
// non-payment suspension by itself and billing is owned by the subscriptions
// module, so there is nothing for the platform team to press here.
export function SubscriptionDetail({ id, filters }: { id: string; filters: SubscriptionFilters }) {
  return (
    <AdminCard aria-labelledby="subscription-title" className="flex flex-col gap-5">
      <Link
        href={subscriptionsHref(filters)}
        className="focus-ring -mb-2 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-md text-xs font-medium text-admin-primary underline-offset-4 hover:underline xl:hidden"
      >
        <ArrowLeft aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4" />
        Back to subscriptions
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <DetailBody id={id} />
      </Suspense>
    </AdminCard>
  );
}

async function DetailBody({ id }: { id: string }) {
  const subscription = await getSubscription(id);
  if (!subscription) notFound();
  const today = todayKey(new Date());
  const status = SUBSCRIPTION_STATUS_META[subscription.status];
  const companyHref = `${adminNavItem("accounts").href}/${encodeURIComponent(subscription.id)}`;

  return (
    <>
      <header className="flex items-start gap-3">
        <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-admin-primary-soft text-admin-primary">
          <CreditCard strokeWidth={ICON_STROKE} className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id="subscription-title" className="text-base font-semibold text-admin-heading">
            {subscription.companyName}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <AdminChip tone="info">{subscription.plan}</AdminChip>
            <AdminChip tone={status.tone} dot>
              {status.label}
            </AdminChip>
          </div>
          <p className="mt-2 text-[11px] text-admin-muted-text">
            {subscription.id} · {subscription.location}
            {subscription.startedAt ? (
              <>
                {" "}
                · Billing since <time dateTime={subscription.startedAt}>{formatDateOnly(subscription.startedAt)}</time>
              </>
            ) : null}
          </p>
        </div>
      </header>

      <StatusNotice subscription={subscription} today={today} />

      <section aria-labelledby="subscription-billing-title">
        <SectionTitle id="subscription-billing-title">Plan &amp; billing</SectionTitle>
        <dl className="flex flex-col gap-2 text-[12.5px]">
          <Fact label="Plan">{subscription.plan}</Fact>
          <Fact label="Amount / month">{formatMoney(subscription.price)}</Fact>
          <Fact label="Billing">{subscription.billingDay ? `Monthly · on the ${ordinal(subscription.billingDay)}` : <Muted>Starts when the owner completes setup</Muted>}</Fact>
          <DueFact subscription={subscription} today={today} />
          {subscription.graceEndsAt ? (
            <Fact label="Grace ends">
              <DateWithDays isoDate={subscription.graceEndsAt} today={today} />
            </Fact>
          ) : null}
          {subscription.suspendedAt ? (
            <Fact label="Suspended since">
              <DateWithDays isoDate={subscription.suspendedAt} today={today} />
            </Fact>
          ) : null}
          <Fact label="Payment method">{subscription.status === "not-started" ? <Muted>Not set up</Muted> : "PayHere · LKR"}</Fact>
        </dl>
      </section>

      <section aria-labelledby="subscription-invoices-title">
        <SectionTitle id="subscription-invoices-title">Billing history</SectionTitle>
        {subscription.invoices.length === 0 ? (
          <p className="text-[12px] text-admin-muted-text">No invoices yet.</p>
        ) : (
          <ol className="flex flex-col">
            {subscription.invoices.map((invoice) => {
              const meta = INVOICE_STATUS_META[invoice.status];
              return (
                <li key={invoice.id} className="flex items-center gap-3 border-b border-admin-border py-2 last:border-b-0">
                  <Receipt aria-hidden="true" strokeWidth={ICON_STROKE} className="size-5 shrink-0 text-admin-icon" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold text-admin-heading">{invoice.number}</p>
                    <p className="mt-0.5 text-[11px] text-admin-muted-text">
                      <time dateTime={invoice.periodStart}>{formatDateOnly(invoice.periodStart)}</time> – <time dateTime={invoice.periodEnd}>{formatDateOnly(invoice.periodEnd)}</time>
                      {invoice.paidAt ? (
                        <>
                          {" "}
                          · paid <time dateTime={invoice.paidAt}>{formatDate(new Date(invoice.paidAt))}</time>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-[12.5px] font-medium whitespace-nowrap text-admin-heading tabular-nums">{formatMoney(invoice.amount)}</span>
                    <AdminChip tone={meta.tone}>{meta.label}</AdminChip>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section aria-labelledby="subscription-company-title">
        <SectionTitle id="subscription-company-title">Company</SectionTitle>
        <div className="flex items-start gap-3 rounded-[10px] bg-admin-muted px-3 py-2.5">
          <Building2 aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-px size-5 shrink-0 text-admin-icon" />
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold text-admin-heading">{subscription.companyName}</p>
            <p className="mt-0.5 text-[11px] text-admin-muted-text">Account status, staff and enforcement history live in Accounts &amp; Enforcement.</p>
          </div>
          <AdminLink href={companyHref} srContext={`${subscription.companyName} in Accounts & Enforcement`}>
            Open
          </AdminLink>
        </div>
      </section>
    </>
  );
}

// What the current status means for the company, and what happens next.
function StatusNotice({ subscription, today }: { subscription: CompanySubscriptionDetail; today: string }) {
  switch (subscription.status) {
    case "past-due":
      return (
        <Notice tone="warning" icon={TriangleAlert}>
          <span className="font-semibold">Grace period ends {subscription.graceEndsAt ? describeDays(daysFromToday(subscription.graceEndsAt, today)) : "soon"}.</span> The charge of{" "}
          {subscription.dueAt ? formatDateOnly(subscription.dueAt) : "this month"} was missed. If it stays unpaid the company is suspended automatically; payment keeps it active.
        </Notice>
      );
    case "suspended":
      return (
        <Notice tone="danger" icon={CircleAlert}>
          <span className="font-semibold">Suspended for non-payment.</span> Staff see the suspended screen and the Owner can only reach Billing. Paying the open invoice lifts the suspension automatically;
          there is nothing to do here.
        </Notice>
      );
    case "not-started":
      return <p className="rounded-[10px] bg-admin-muted px-3 py-2.5 text-[11.5px] leading-snug text-admin-muted-text">The owner has not finished setting up this company. Billing starts on the {subscription.plan} plan once it is active.</p>;
    default:
      return null;
  }
}

function Notice({ tone, icon: Icon, children }: { tone: "warning" | "danger"; icon: typeof TriangleAlert; children: ReactNode }) {
  return (
    <p className={cn("flex items-start gap-2.5 rounded-[10px] px-3 py-2.5 text-[11.5px] leading-snug", tone === "warning" ? "bg-admin-warning-soft text-admin-warning" : "bg-admin-danger-soft text-admin-danger")}>
      <Icon aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-px size-[18px] shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function DueFact({ subscription, today }: { subscription: CompanySubscriptionDetail; today: string }) {
  if (!subscription.dueAt) return null;
  const label = subscription.status === "paid" ? "Next charge" : subscription.status === "suspended" ? "Lapsed charge" : "Missed charge";
  return (
    <Fact label={label}>
      <DateWithDays isoDate={subscription.dueAt} today={today} />
    </Fact>
  );
}

function DateWithDays({ isoDate, today }: { isoDate: string; today: string }) {
  return (
    <>
      <time dateTime={isoDate}>{formatDateOnly(isoDate)}</time>
      <span className="block text-[11px] font-normal text-admin-muted-text">{describeDays(daysFromToday(isoDate, today))}</span>
    </>
  );
}

function Muted({ children }: { children: ReactNode }) {
  return <span className="font-normal text-admin-muted-text">{children}</span>;
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

// Shown beside the list on wide screens while nothing is selected.
export function DetailPlaceholder({ className }: { className?: string }) {
  return (
    <AdminCard aria-label="Subscription detail" className={cn("min-h-[320px] flex-col items-center justify-center gap-2 text-center", className)}>
      <CreditCard aria-hidden="true" strokeWidth={ICON_STROKE} className="size-6 text-admin-icon" />
      <p className="text-[13px] font-semibold text-admin-heading">Select a company</p>
      <p className="max-w-[260px] text-[12px] text-admin-muted-text">Plan, billing dates, grace period and invoice history open here.</p>
    </AdminCard>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" className="space-y-3">
      <span className="sr-only">Loading subscription</span>
      <AdminSkeleton className="h-10 w-56" />
      {Array.from({ length: 5 }, (_, i) => (
        <AdminSkeleton key={i} className="h-5" />
      ))}
      <AdminSkeleton className="h-16" />
      {Array.from({ length: 4 }, (_, i) => (
        <AdminSkeleton key={i} className="h-10" />
      ))}
    </div>
  );
}
