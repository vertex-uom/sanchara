"use client";

import { useId, useState, useTransition } from "react";
import { Ban, Info, Loader2, RotateCcw, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminDialog, AdminDialogClose } from "../components/dialog";
import { AdminField, AdminSelect, AdminTextarea } from "../components/form";
import { AdminButton } from "../components/ui";
import { ICON_STROKE } from "../sidebar-modes";
import type { CompanyAccountDetail } from "../types";
import { reactivateCompany, suspendCompany, type CompanyActionResult } from "./company-actions";

// Suspend and Reactivate, the two enforcement actions the platform supports
// for a company. Each needs a reason (category plus note), shows what the
// action affects, and is recorded in the company's history and the audit log.

const SUSPEND_REASONS = ["Policy violation", "Fraud", "Legal request", "Owner request", "Other"];
const REACTIVATE_REASONS = ["Issue resolved", "Owner request", "Suspended in error", "Legal hold lifted", "Other"];

const SUSPEND_CONSEQUENCES = [
  "The Owner can only open Billing. Managers and Front Desk see a suspended screen.",
  "Every Back Office action for the company is refused until it is reactivated.",
];
const REACTIVATE_CONSEQUENCES = ["Staff access to the Back Office is restored immediately."];

function useStatusChange(action: (id: string, reason: string) => Promise<CompanyActionResult>, companyId: string, reasons: string[]) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(reasons[0]);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const noteNeeded = reason === "Other" && !note.trim();
  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setMessage(null);
  }
  function confirm() {
    if (noteNeeded) return setMessage("Describe the reason for \u201cOther\u201d.");
    startTransition(async () => {
      const result = await action(companyId, note.trim() ? `${reason} · ${note.trim()}` : reason);
      if (result.ok) onOpenChange(false);
      else setMessage(result.message);
    });
  }
  return { open, onOpenChange, reason, setReason, note, setNote, message, pending, confirm };
}

export function SuspendDialog({ company }: { company: CompanyAccountDetail }) {
  const id = useId();
  const change = useStatusChange(suspendCompany, company.id, SUSPEND_REASONS);

  return (
    <AdminDialog
      open={change.open}
      onOpenChange={change.onOpenChange}
      trigger={
        <AdminButton icon={Ban} variant="danger" className="w-full">
          Suspend company
        </AdminButton>
      }
      title={`Suspend ${company.name}?`}
      description="The company stays suspended until an administrator reactivates it."
      footer={<Footer icon={Ban} variant="danger" pending={change.pending} onConfirm={change.confirm} label="Confirm suspension" />}
    >
      <AdminField label="Reason (required)" htmlFor={`${id}-reason`}>
        <AdminSelect id={`${id}-reason`} value={change.reason} onChange={(event) => change.setReason(event.target.value)} required>
          {SUSPEND_REASONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </AdminSelect>
      </AdminField>
      <AdminField label="Note for the history" htmlFor={`${id}-note`}>
        <AdminTextarea
          id={`${id}-note`}
          maxLength={400}
          value={change.note}
          onChange={(event) => change.setNote(event.target.value)}
          placeholder={change.reason === "Other" ? "Describe the reason (required for \u201cOther\u201d)" : "What happened and what the owner must do"}
          required={change.reason === "Other"}
        />
      </AdminField>
      <ImpactPreview company={company} tone="warning" consequences={SUSPEND_CONSEQUENCES} />
      <Refusal message={change.message} />
      <AuditNote />
    </AdminDialog>
  );
}

export function ReactivateDialog({ company }: { company: CompanyAccountDetail }) {
  const id = useId();
  const change = useStatusChange(reactivateCompany, company.id, REACTIVATE_REASONS);

  return (
    <AdminDialog
      open={change.open}
      onOpenChange={change.onOpenChange}
      trigger={
        <AdminButton icon={RotateCcw} variant="primary" className="w-full">
          Reactivate company
        </AdminButton>
      }
      title={`Reactivate ${company.name}?`}
      description="Lifts the administrator suspension. The company returns to Active."
      footer={<Footer icon={RotateCcw} variant="primary" pending={change.pending} onConfirm={change.confirm} label="Confirm reactivation" />}
    >
      <AdminField label="Reason (required)" htmlFor={`${id}-reason`}>
        <AdminSelect id={`${id}-reason`} value={change.reason} onChange={(event) => change.setReason(event.target.value)} required>
          {REACTIVATE_REASONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </AdminSelect>
      </AdminField>
      <AdminField label="Note for the history" htmlFor={`${id}-note`}>
        <AdminTextarea id={`${id}-note`} maxLength={400} value={change.note} onChange={(event) => change.setNote(event.target.value)} placeholder="How the issue was resolved" />
      </AdminField>
      <ImpactPreview company={company} tone="success" consequences={REACTIVATE_CONSEQUENCES} />
      <Refusal message={change.message} />
      <AuditNote />
    </AdminDialog>
  );
}

function Footer({ icon, variant, pending, onConfirm, label }: { icon: LucideIcon; variant: "danger" | "primary"; pending: boolean; onConfirm: () => void; label: string }) {
  return (
    <>
      <CancelButton />
      <AdminButton
        icon={pending ? Loader2 : icon}
        variant={variant}
        onClick={onConfirm}
        disabled={pending}
        aria-busy={pending || undefined}
        className={pending ? "[&>svg]:animate-spin" : undefined}
      >
        {label}
      </AdminButton>
    </>
  );
}

function Refusal({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className="rounded-[10px] bg-admin-danger-soft px-3 py-2.5 text-[12.5px] text-admin-danger">
      {message}
    </p>
  ) : null;
}

// What the action touches: counts the platform knows about a company. No
// reservations, payouts or channels — Platform Admin never reads bookings.
function ImpactPreview({ company, tone, consequences }: { company: CompanyAccountDetail; tone: "warning" | "success"; consequences: string[] }) {
  const staff = company.staff.owners + company.staff.managers + company.staff.frontDesk;
  const facts = [
    [company.properties.length, "properties"],
    [staff, "staff"],
    [company.siteHosts.length, company.siteHosts.length === 1 ? "domain" : "domains"],
  ] as const;

  return (
    <section
      aria-label="Impact"
      className={cn("rounded-[10px] px-3 py-2.5 text-xs", tone === "warning" ? "bg-admin-warning-soft text-admin-warning" : "bg-admin-success-soft text-admin-success")}
    >
      <p className="font-semibold">
        Affects{" "}
        {facts.map(([count, label], i) => (
          <span key={label}>
            {i > 0 ? " · " : ""}
            {count} {label}
          </span>
        ))}{" "}
        · subscription {company.subscription.state === "paid" ? "paid" : company.subscription.state.replace("-", " ")}
      </p>
      <ul className="mt-1.5 list-disc space-y-0.5 pl-4 leading-snug text-admin-body">
        {consequences.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}

function AuditNote() {
  return (
    <p className="flex items-start gap-2 text-[11px] text-admin-muted-text">
      <Info aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-px size-3.5 shrink-0" />
      <span>A reason is mandatory. This action is recorded in the company&apos;s history and the audit log.</span>
    </p>
  );
}

function CancelButton() {
  return (
    <AdminDialogClose asChild>
      <AdminButton>Cancel</AdminButton>
    </AdminDialogClose>
  );
}
