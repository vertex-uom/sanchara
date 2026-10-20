import { Suspense } from "react";
import { Clock, History, KeyRound, Lock, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";
import { formatRelativeDateTime } from "@/lib/format/dates";
import { AdminCard, AdminCardHeader, AdminSkeleton } from "../components/ui";
import { ICON_STROKE } from "../sidebar-modes";
import { listAdminAccountChanges } from "../server/admin-users";
import { CHANGE_KIND_LABELS } from "./status";

// The access rules are fixed by the architecture (docs/frontend-architecture:
// "Admin: email+password, then mandatory two-step verification; short idle
// timeout"). Stated here as facts; nothing to toggle.
const POLICY: { icon: LucideIcon; title: string; detail: string }[] = [
  { icon: KeyRound, title: "Email and password", detail: "Platform admins sign in with their work email. No Google sign-in for this console." },
  { icon: ShieldCheck, title: "Two-step verification, mandatory", detail: "Enrolled on first sign-in and required every time. Cannot be turned off per account." },
  { icon: Clock, title: "Short idle timeout", detail: "Sessions end after a short period of inactivity and on deactivation." },
  { icon: Lock, title: "One role: Platform Admin", detail: "Every admin has the same access. There are no custom roles, scopes or temporary elevation." },
];

export function AccessPolicy() {
  return (
    <AdminCard aria-labelledby="access-policy-title">
      <AdminCardHeader id="access-policy-title" icon={Lock} title="Access policy" />
      <ul className="flex flex-col">
        {POLICY.map(({ icon: Icon, title, detail }) => (
          <li key={title} className="flex items-start gap-3 border-b border-admin-border py-2.5 first:pt-0 last:border-b-0 last:pb-0">
            <Icon aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-px size-5 shrink-0 text-admin-icon" />
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-admin-heading">{title}</p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-admin-muted-text">{detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </AdminCard>
  );
}

// Account-lifecycle changes only: invited, activated, deactivated,
// reactivated. There is no permission history because there is one role.
export function AccountChanges() {
  return (
    <AdminCard aria-labelledby="account-changes-title">
      <AdminCardHeader id="account-changes-title" icon={History} title="Admin account changes" />
      <Suspense fallback={<ChangesSkeleton />}>
        <ChangesList />
      </Suspense>
    </AdminCard>
  );
}

async function ChangesList() {
  const changes = await listAdminAccountChanges();
  const now = new Date();
  if (changes.length === 0) return <p className="text-[12px] text-admin-muted-text">No changes recorded.</p>;
  return (
    <ol className="flex flex-col">
      {changes.map((change) => (
        <li key={change.id} className="flex min-h-[46px] items-center gap-3 border-b border-admin-border py-2 last:border-b-0">
          <UserRound aria-hidden="true" strokeWidth={ICON_STROKE} className="size-5 shrink-0 text-admin-icon" />
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold text-admin-heading">
              {change.adminName} · {CHANGE_KIND_LABELS[change.kind].toLowerCase()}
            </p>
            <p className="mt-0.5 text-[11px] text-admin-muted-text">
              {change.actor === change.adminName ? "Accepted the invite" : `By ${change.actor}`} · <time dateTime={change.occurredAt}>{formatRelativeDateTime(change.occurredAt, now)}</time>
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ChangesSkeleton() {
  return (
    <div aria-busy="true" className="space-y-2">
      <span className="sr-only">Loading account changes</span>
      {Array.from({ length: 5 }, (_, i) => (
        <AdminSkeleton key={i} className="h-10" />
      ))}
    </div>
  );
}
