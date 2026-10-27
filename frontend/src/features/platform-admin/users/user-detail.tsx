import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Lock, UsersRound } from "lucide-react";
import { formatDateOnly, formatDateTime, formatRelativeDateTime } from "@/lib/format/dates";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format/names";
import { AdminCard, AdminChip, AdminLink, AdminSkeleton } from "../components/ui";
import { adminNavItem } from "../nav";
import { ICON_STROKE } from "../sidebar-modes";
import { getStaffUser } from "../server/users";
import type { StaffFilters } from "../types";
import { AccountActions } from "./account-actions";
import { usersHref } from "./search-params";
import { ROLE_META, SIGN_IN_METHOD_LABELS, STAFF_STATUS_META } from "./status";

// Right-hand detail panel (400px in the design). Sections are stacked:
// Identity & contact, Company, Security, then the account actions.
export function UserDetail({ id, filters }: { id: string; filters: StaffFilters }) {
  return (
    <AdminCard aria-labelledby="user-title" className="flex flex-col gap-5">
      <Link
        href={usersHref(filters)}
        className="focus-ring -mb-2 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-md text-xs font-medium text-admin-primary underline-offset-4 hover:underline xl:hidden"
      >
        <ArrowLeft aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4" />
        Back to users
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <DetailBody id={id} />
      </Suspense>
    </AdminCard>
  );
}

async function DetailBody({ id }: { id: string }) {
  const user = await getStaffUser(id);
  if (!user) notFound();
  const now = new Date();
  const role = ROLE_META[user.role];
  const status = STAFF_STATUS_META[user.status];
  const { security } = user;
  const companyHref = `${adminNavItem("accounts").href}/${encodeURIComponent(user.companyId)}`;

  return (
    <>
      <header className="flex items-start gap-3">
        <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-admin-primary-soft text-[13px] font-semibold text-admin-primary">
          {initials(user.name)}
        </span>
        <div className="min-w-0">
          <h2 id="user-title" className="text-base font-semibold text-admin-heading">
            {user.name}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <AdminChip tone={role.tone}>{role.label}</AdminChip>
            <AdminChip tone={status.tone} dot>
              {status.label}
            </AdminChip>
          </div>
          <p className="mt-2 text-[11px] text-admin-muted-text">
            {user.id} · Created <time dateTime={user.createdAt}>{formatDateOnly(user.createdAt.slice(0, 10))}</time>
          </p>
        </div>
      </header>

      <section aria-labelledby="user-identity-title">
        <SectionTitle id="user-identity-title">Identity &amp; contact</SectionTitle>
        <dl className="flex flex-col gap-2 text-[12.5px]">
          <Fact label="Email">{user.email}</Fact>
          <Fact label="Phone">{user.phone ?? <span className="font-normal text-admin-muted-text">Not provided</span>}</Fact>
          <Fact label="Sign-in">{SIGN_IN_METHOD_LABELS[user.signInMethod]}</Fact>
          <Fact label="Invited by">{user.invitedBy}</Fact>
          <Fact label={user.status === "invited" ? "Invite sent" : "Activated"}>
            {user.status === "invited" || !user.activatedAt ? formatDateTime(user.createdAt) : formatDateTime(user.activatedAt)}
          </Fact>
        </dl>
      </section>

      <section aria-labelledby="user-company-title">
        <SectionTitle id="user-company-title">Company</SectionTitle>
        <div className="flex items-start gap-3 rounded-[10px] bg-admin-muted px-3 py-2.5">
          <Building2 aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-px size-5 shrink-0 text-admin-icon" />
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold text-admin-heading">{user.companyName}</p>
            <p className="mt-0.5 text-[11px] text-admin-muted-text">
              {user.role === "front-desk" ? "Works at" : "All properties"}: {user.properties.join(", ")}
            </p>
            {user.companyStatus !== "active" ? (
              <p className={cn("mt-1 text-[11px] font-medium", user.companyStatus === "pending" ? "text-admin-muted-text" : "text-admin-danger")}>
                {user.companyStatus === "pending" ? "Company pending setup" : "Company suspended — staff see the suspended screen"}
              </p>
            ) : null}
          </div>
          <AdminLink href={companyHref} srContext={`${user.companyName} in Accounts & Enforcement`}>
            Open
          </AdminLink>
        </div>
      </section>

      <section aria-labelledby="user-security-title">
        <SectionTitle id="user-security-title">Security</SectionTitle>
        {security.lockedAt ? (
          <p className="mb-2.5 flex items-start gap-2.5 rounded-[10px] bg-admin-danger-soft px-3 py-2.5 text-[11.5px] leading-snug text-admin-danger">
            <Lock aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-px size-[18px] shrink-0" />
            <span>
              <span className="font-semibold">Locked</span> <time dateTime={security.lockedAt}>{formatRelativeDateTime(security.lockedAt, now)}</time> after repeated failed sign-ins.
            </span>
          </p>
        ) : null}
        <dl className="flex flex-col gap-2 text-[12.5px]">
          <Fact label="Last login">
            {security.lastLogin ? (
              <>
                <time dateTime={security.lastLogin.at}>{formatRelativeDateTime(security.lastLogin.at, now)}</time>
                <span className="block text-[11px] font-normal text-admin-muted-text">
                  {security.lastLogin.client} · {security.lastLogin.location}
                </span>
              </>
            ) : (
              <span className="font-normal text-admin-muted-text">Never signed in</span>
            )}
          </Fact>
          <Fact label="Active sessions">{security.activeSessions === 0 ? "None" : `${security.activeSessions} ${security.activeSessions === 1 ? "device" : "devices"}`}</Fact>
          <Fact label="Failed logins (24h)">
            <span className={cn(security.failedLogins24h > 0 && "text-admin-danger")}>{security.failedLogins24h}</span>
          </Fact>
        </dl>
      </section>

      <AccountActions user={user} />
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

// Shown beside the list on wide screens while nothing is selected.
export function DetailPlaceholder({ className }: { className?: string }) {
  return (
    <AdminCard aria-label="User detail" className={cn("min-h-[320px] flex-col items-center justify-center gap-2 text-center", className)}>
      <UsersRound aria-hidden="true" strokeWidth={ICON_STROKE} className="size-6 text-admin-icon" />
      <p className="text-[13px] font-semibold text-admin-heading">Select a user</p>
      <p className="max-w-[260px] text-[12px] text-admin-muted-text">Contact details, company, sign-in security and account actions open here.</p>
    </AdminCard>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" className="space-y-3">
      <span className="sr-only">Loading user</span>
      <AdminSkeleton className="h-10 w-56" />
      {Array.from({ length: 5 }, (_, i) => (
        <AdminSkeleton key={i} className="h-5" />
      ))}
      <AdminSkeleton className="h-16" />
      {Array.from({ length: 3 }, (_, i) => (
        <AdminSkeleton key={i} className="h-5" />
      ))}
    </div>
  );
}
