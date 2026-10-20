"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, CheckCircle2, ClipboardCopy, Download, Eye, EyeOff, Mail, Plus, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminButton, AdminButtonLink, AdminChip } from "../components/ui";
import { ICON_STROKE } from "../sidebar-modes";
import type { OwnerCredentials } from "../types";
import { credentialsCsv, credentialsCsvFilename } from "./credentials";
import { onboardingHref } from "./search-params";

const EMAIL_SEND_MS = 1800;

// Result screen: the Owner's sign-in details, shown once, with copy and CSV
// like a cloud console's "download .csv" step, and the email going out.
export function CredentialsPanel({ credentials, onCreateAnother }: { credentials: OwnerCredentials; onCreateAnother: () => void }) {
  const expires = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Colombo" }).format(new Date(credentials.expiresAt));

  return (
    <div className="flex flex-col gap-5" aria-live="polite">
      <header className="flex items-start gap-3">
        <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-admin-success-soft text-admin-success">
          <CheckCircle2 strokeWidth={ICON_STROKE} className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id="create-company-step-title" className="text-base font-semibold text-admin-heading">
            {credentials.companyName} is ready
          </h2>
          <p className="mt-1 text-[12.5px] text-admin-muted-text">
            Pending setup until {credentials.ownerName} signs in and changes the temporary password. Credentials valid until {expires}.
          </p>
        </div>
      </header>

      <EmailStatus to={credentials.ownerEmail} />

      <p className="flex items-start gap-2 rounded-[10px] bg-admin-warning-soft px-3 py-2.5 text-[12px] leading-snug text-admin-warning">
        <TriangleAlert aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-0.5 size-4 shrink-0" />
        <span>This is the only time the temporary password is shown here. Copy it or download the CSV now; afterwards you can only regenerate it.</span>
      </p>

      <section aria-label="Owner sign-in details" className="flex flex-col gap-3 rounded-[10px] border border-admin-border p-4">
        <CopyField label="Owner email" value={credentials.ownerEmail} />
        <CopyField label="Temporary password" value={credentials.temporaryPassword} secret />
        <CopyField label="Owner portal link" value={credentials.ownerPortalLink} note="Owner only. Do not send to Managers or Front Desk staff." />
      </section>

      <div className="flex flex-wrap gap-2">
        <AdminButton icon={Download} variant="primary" onClick={() => downloadCsv(credentials)}>
          Download .csv
        </AdminButton>
        <CopyButton label="Copy CSV" text={credentialsCsv(credentials)} />
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

// "Sending…" then "Sent". TODO(onboarding): reflect the API's delivery state.
function EmailStatus({ to }: { to: string }) {
  const [sent, setSent] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSent(true), EMAIL_SEND_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div role="status" className={cn("flex items-center gap-3 rounded-[10px] border px-3 py-2.5 transition-colors motion-reduce:transition-none", sent ? "border-admin-success/30 bg-admin-success-soft" : "border-admin-border bg-admin-muted")}>
      <span aria-hidden="true" className={cn("relative inline-flex size-8 shrink-0 items-center justify-center rounded-full", sent ? "bg-admin-success text-white" : "bg-admin-card text-admin-primary")}>
        {sent ? <CheckCircle2 strokeWidth={ICON_STROKE} className="size-4" /> : <Mail strokeWidth={ICON_STROKE} className="size-4 animate-pulse motion-reduce:animate-none" />}
        {!sent ? <span className="absolute inset-0 animate-ping rounded-full border border-admin-primary/40 motion-reduce:hidden" /> : null}
      </span>
      <div className="min-w-0 text-[12.5px]">
        {sent ? (
          <>
            <p className="font-medium text-admin-success">Email sent to {to}</p>
            <p className="text-[11px] text-admin-muted-text">Owner-portal link, temporary password and first-sign-in instructions.</p>
          </>
        ) : (
          <>
            <p className="font-medium text-admin-heading">Sending the sign-in details to {to}…</p>
            <p className="text-[11px] text-admin-muted-text">Owner-portal link and temporary password.</p>
          </>
        )}
      </div>
      {sent ? (
        <AdminChip tone="success" className="ml-auto">
          Sent
        </AdminChip>
      ) : null}
    </div>
  );
}

function CopyField({ label, value, secret = false, note }: { label: string; value: string; secret?: boolean; note?: string }) {
  const [shown, setShown] = useState(!secret);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] leading-[14px] font-medium text-admin-muted-text">{label}</span>
      <div className="flex items-center gap-2">
        <code aria-label={secret && !shown ? `${label} hidden` : undefined} className="min-w-0 flex-1 truncate rounded-md border border-admin-border bg-admin-muted px-3 py-2 font-mono text-[12.5px] text-admin-heading">
          {secret && !shown ? "•".repeat(Math.min(value.length, 16)) : value}
        </code>
        {secret ? (
          <AdminButton icon={shown ? EyeOff : Eye} onClick={() => setShown((s) => !s)} aria-pressed={shown}>
            {shown ? "Hide" : "Show"}
          </AdminButton>
        ) : null}
        <CopyButton label="Copy" text={value} srLabel={`Copy ${label.toLowerCase()}`} />
      </div>
      {note ? <p className="text-[11px] text-admin-muted-text">{note}</p> : null}
    </div>
  );
}

function CopyButton({ label, text, srLabel }: { label: string; text: string; srLabel?: string }): ReactNode {
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
      {copied ? "Copied" : label}
    </AdminButton>
  );
}

function downloadCsv(credentials: OwnerCredentials) {
  const blob = new Blob([credentialsCsv(credentials)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = credentialsCsvFilename(credentials);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
