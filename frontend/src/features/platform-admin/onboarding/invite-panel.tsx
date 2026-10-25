"use client";

import { useState, useTransition, type ReactNode } from "react";
import { ArrowLeft, CheckCircle2, ClipboardCopy, Info, Loader2, Plus, RefreshCw, TriangleAlert } from "lucide-react";
import { AdminButton, AdminButtonLink } from "../components/ui";
import { ICON_STROKE } from "../sidebar-modes";
import type { CreatedCompany, OwnerInvite } from "../types";
import { reissueOwnerInvite } from "./actions";
import { onboardingHref } from "./search-params";

const formatExpiry = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Colombo" }).format(new Date(iso));

// Result screen: the company exists, and the Owner's single-use invite link is
// shown once. Email isn't connected yet, so the admin passes the link on.
export function InvitePanel({ created, onCreateAnother }: { created: CreatedCompany; onCreateAnother: () => void }) {
  const [invite, setInvite] = useState<OwnerInvite | null>(created.invite);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, startRegenerate] = useTransition();
  const { company, owner } = created;

  const regenerate = () =>
    startRegenerate(async () => {
      const result = await reissueOwnerInvite(company.id);
      if (result.ok) {
        setInvite(result.invite);
        setError(null);
      } else {
        setError(result.message);
      }
    });

  return (
    <div className="flex flex-col gap-5" aria-live="polite">
      <header className="flex items-start gap-3">
        <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-admin-success-soft text-admin-success">
          <CheckCircle2 strokeWidth={ICON_STROKE} className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id="create-company-step-title" className="text-base font-semibold text-admin-heading">
            {company.name} is ready
          </h2>
          <p className="mt-1 text-[12.5px] text-admin-muted-text">
            Pending setup until {owner.fullName} opens the invite link and sets a password.
            {invite ? ` The link works once, until ${formatExpiry(invite.expiresAt)}.` : null}
          </p>
        </div>
      </header>

      <Callout icon={Info} tone="info">
        Email isn&apos;t connected yet, so nothing was sent. Send this link to {owner.email} yourself, by email or WhatsApp. Only the Owner should get it: whoever opens it sets the Owner&apos;s password.
      </Callout>

      {invite ? (
        <Callout icon={TriangleAlert} tone="warning">
          The link is shown only here, now. If it gets lost, generate a new one; the old link then stops working.
        </Callout>
      ) : (
        <Callout icon={TriangleAlert} tone="danger">
          The company was created, but the invite link couldn&apos;t be issued. Generate it now.
        </Callout>
      )}

      <section aria-label="Owner invite" className="flex flex-col gap-3 rounded-[10px] border border-admin-border p-4">
        <CopyField label="Owner email" value={owner.email} />
        {invite ? <CopyField label="Invite link" value={invite.url} note="Owner only. Never send it to Managers or Front Desk staff." /> : null}
        <CopyField label="Company site" value={company.siteHost} />
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <AdminButton icon={regenerating ? Loader2 : RefreshCw} onClick={regenerate} disabled={regenerating} aria-busy={regenerating || undefined} className={regenerating ? "[&>svg]:animate-spin" : undefined}>
          {regenerating ? "Generating…" : invite ? "Generate a new link" : "Generate the invite link"}
        </AdminButton>
        {error ? (
          <p role="alert" className="text-[12px] text-admin-danger">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-admin-border pt-4">
        <AdminButtonLink href={onboardingHref()} icon={ArrowLeft}>
          Back to Onboarding
        </AdminButtonLink>
        <AdminButton icon={Plus} onClick={onCreateAnother}>
          Create another company
        </AdminButton>
      </div>
    </div>
  );
}

const CALLOUT_TONE = {
  info: "bg-admin-info-soft text-admin-info",
  warning: "bg-admin-warning-soft text-admin-warning",
  danger: "bg-admin-danger-soft text-admin-danger",
} as const;

function Callout({ icon: Icon, tone, children }: { icon: typeof Info; tone: keyof typeof CALLOUT_TONE; children: ReactNode }) {
  return (
    <p className={`flex items-start gap-2 rounded-[10px] px-3 py-2.5 text-[12px] leading-snug ${CALLOUT_TONE[tone]}`}>
      <Icon aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function CopyField({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] leading-[14px] font-medium text-admin-muted-text">{label}</span>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-md border border-admin-border bg-admin-muted px-3 py-2 font-mono text-[12.5px] text-admin-heading">{value}</code>
        <CopyButton text={value} srLabel={`Copy ${label.toLowerCase()}`} />
      </div>
      {note ? <p className="text-[11px] text-admin-muted-text">{note}</p> : null}
    </div>
  );
}

function CopyButton({ text, srLabel }: { text: string; srLabel: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (insecure context); the value is selectable on screen.
    }
  };
  return (
    <AdminButton icon={copied ? CheckCircle2 : ClipboardCopy} onClick={copy} aria-label={srLabel} className={copied ? "text-admin-success" : undefined}>
      {copied ? "Copied" : "Copy"}
    </AdminButton>
  );
}
