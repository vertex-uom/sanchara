"use client";

import { useId, useState } from "react";
import { Ban, Info, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminDialog, AdminDialogClose } from "../components/dialog";
import { AdminField, AdminSelect, AdminTextarea } from "../components/form";
import { AdminButton } from "../components/ui";
import { ICON_STROKE } from "../sidebar-modes";
import type { CompanyAccountDetail } from "../types";

// Suspend and Reactivate, the two enforcement actions the platform supports
// for a company. Each needs a reason and shows what the action affects. The
// confirm buttons are placeholders until the platform-admin API exists.
// TODO(accounts): submit each action through a Server Action and record it
// in the audit log.

const SUSPEND_REASONS = ["Policy violation", "Fraud", "Legal request", "Owner request", "Other"];
const REACTIVATE_REASONS = ["Issue resolved", "Owner request", "Suspended in error", "Legal hold lifted", "Other"];

const SUSPEND_CONSEQUENCES = [
  "The company website stays online; the booking page shows a notice instead of availability.",
  "The owner can only open Billing. Managers and front desk see a suspended screen.",
  "The company is hidden from the public directory until reactivated.",
];
const REACTIVATE_CONSEQUENCES = ["Booking page, staff access and the directory listing are restored immediately."];

export function SuspendDialog({ company }: { company: CompanyAccountDetail }) {
  const id = useId();
  const [reason, setReason] = useState(SUSPEND_REASONS[0]);
  const [notify, setNotify] = useState(true);

  return (
    <AdminDialog
      trigger={
        <AdminButton icon={Ban} variant="danger" className="w-full">
          Suspend company
        </AdminButton>
      }
      title={`Suspend ${company.name}?`}
      description="The company stays suspended until an administrator reactivates it."
      footer={
        <>
          <CancelButton />
          <AdminButton icon={Ban} variant="danger" placeholder>
            Confirm suspension
          </AdminButton>
        </>
      }
    >
      <AdminField label="Reason (required)" htmlFor={`${id}-reason`}>
        <AdminSelect id={`${id}-reason`} value={reason} onChange={(event) => setReason(event.target.value)} required>
          {SUSPEND_REASONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </AdminSelect>
      </AdminField>
      <AdminField label="Note for the audit log" htmlFor={`${id}-note`}>
        <AdminTextarea id={`${id}-note`} placeholder={reason === "Other" ? "Describe the reason (required for “Other”)" : "What happened and what the owner must do"} required={reason === "Other"} />
      </AdminField>
      <ImpactPreview company={company} tone="warning" consequences={SUSPEND_CONSEQUENCES} />
      <NotifyToggle checked={notify} onChange={setNotify} template="Suspension notice (EN)" />
      <AuditNote />
    </AdminDialog>
  );
}

export function ReactivateDialog({ company }: { company: CompanyAccountDetail }) {
  const id = useId();
  const [notify, setNotify] = useState(true);

  return (
    <AdminDialog
      trigger={
        <AdminButton icon={RotateCcw} variant="primary" className="w-full">
          Reactivate company
        </AdminButton>
      }
      title={`Reactivate ${company.name}?`}
      description="Lifts the administrator suspension. The company returns to Active."
      footer={
        <>
          <CancelButton />
          <AdminButton icon={RotateCcw} variant="primary" placeholder>
            Confirm reactivation
          </AdminButton>
        </>
      }
    >
      <AdminField label="Reason (required)" htmlFor={`${id}-reason`}>
        <AdminSelect id={`${id}-reason`} defaultValue={REACTIVATE_REASONS[0]} required>
          {REACTIVATE_REASONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </AdminSelect>
      </AdminField>
      <AdminField label="Note for the audit log" htmlFor={`${id}-note`}>
        <AdminTextarea id={`${id}-note`} placeholder="How the issue was resolved" />
      </AdminField>
      <ImpactPreview company={company} tone="success" consequences={REACTIVATE_CONSEQUENCES} />
      <NotifyToggle checked={notify} onChange={setNotify} template="Reactivation notice (EN)" />
      <AuditNote />
    </AdminDialog>
  );
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

function NotifyToggle({ checked, onChange, template }: { checked: boolean; onChange: (next: boolean) => void; template: string }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] border border-admin-border px-3 py-2.5">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-[12.5px] font-semibold text-admin-heading">
          Notify owner
        </label>
        <p className="mt-0.5 text-[11px] text-admin-muted-text">{checked ? `Email · template “${template}”` : "No email is sent"}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "focus-ring relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors motion-reduce:transition-none",
          checked ? "bg-admin-primary" : "bg-admin-border",
        )}
      >
        <span aria-hidden="true" className={cn("inline-block size-4 rounded-full bg-white shadow transition-transform motion-reduce:transition-none", checked ? "translate-x-4.5" : "translate-x-0.5")} />
      </button>
    </div>
  );
}

function AuditNote() {
  return (
    <p className="flex items-start gap-2 text-[11px] text-admin-muted-text">
      <Info aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-px size-3.5 shrink-0" />
      <span>A reason is mandatory. This action is recorded in the audit log. Connects to the API in a later step.</span>
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
