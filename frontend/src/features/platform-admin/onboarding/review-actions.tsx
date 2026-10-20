"use client";

import { useId, useState } from "react";
import { Check, MessageSquareMore, CirclePause, X } from "lucide-react";
import { AdminDialog, AdminDialogClose } from "../components/dialog";
import { AdminField, AdminSelect, AdminTextarea } from "../components/form";
import { AdminButton } from "../components/ui";
import type { OwnerApplicationDetail } from "../types";

// The four review actions. Each opens a confirmation; Reject and Hold need a
// reason, Request info sends a message to the applicant. The confirm buttons
// are placeholders until the platform-admin API exists.
// TODO(onboarding): submit each action through a Server Action and record it
// in the audit log.
export function ReviewActions({ application }: { application: OwnerApplicationDetail }) {
  const verified = application.documents.filter((d) => d.status === "verified").length;
  const total = application.documents.length;

  return (
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Review actions">
      <HoldDialog />
      <RequestInfoDialog applicantFirstName={application.applicantName.split(" ")[0] ?? application.applicantName} />
      <ApproveDialog businessName={application.businessName} verified={verified} total={total} />
      <RejectDialog />
    </div>
  );
}

const PENDING_NOTE = "Connects to the API in a later step.";

function PendingNote() {
  return <p className="text-[11px] text-admin-muted-text">{PENDING_NOTE}</p>;
}

function CancelButton() {
  return (
    <AdminDialogClose asChild>
      <AdminButton>Cancel</AdminButton>
    </AdminDialogClose>
  );
}

const TEMPLATES = {
  documents: {
    label: "Request documents",
    body: (name: string) => `Hi ${name}, we need one more document to finish reviewing your application. Please upload it from your dashboard.`,
  },
  licence: {
    label: "Expired licence",
    body: (name: string) => `Hi ${name}, your tourism licence on file has expired. Please upload the renewed licence to continue.`,
  },
  ownership: {
    label: "Clarify ownership",
    body: (name: string) => `Hi ${name}, the ownership / lease proof does not match the declared property. Could you clarify or upload the correct document?`,
  },
  custom: { label: "Custom message", body: () => "" },
} as const;

type TemplateKey = keyof typeof TEMPLATES;

function RequestInfoDialog({ applicantFirstName }: { applicantFirstName: string }) {
  const id = useId();
  const [template, setTemplate] = useState<TemplateKey>("documents");
  const [message, setMessage] = useState(TEMPLATES.documents.body(applicantFirstName));

  const pickTemplate = (key: TemplateKey) => {
    setTemplate(key);
    setMessage(TEMPLATES[key].body(applicantFirstName));
  };

  return (
    <AdminDialog
      trigger={
        <AdminButton icon={MessageSquareMore} className="w-full">
          Request info
        </AdminButton>
      }
      title="Request more information"
      description="The applicant receives this message by email and in their dashboard. The application moves to “Awaiting applicant”."
      footer={
        <>
          <CancelButton />
          <AdminButton icon={MessageSquareMore} variant="primary" placeholder>
            Send request
          </AdminButton>
        </>
      }
    >
      <AdminField label="Template" htmlFor={`${id}-template`}>
        <AdminSelect id={`${id}-template`} value={template} onChange={(event) => pickTemplate(event.target.value as TemplateKey)}>
          {(Object.keys(TEMPLATES) as TemplateKey[]).map((key) => (
            <option key={key} value={key}>
              {TEMPLATES[key].label}
            </option>
          ))}
        </AdminSelect>
      </AdminField>
      <AdminField label="Message to the applicant" htmlFor={`${id}-message`}>
        <AdminTextarea id={`${id}-message`} value={message} onChange={(event) => setMessage(event.target.value)} required />
      </AdminField>
      <PendingNote />
    </AdminDialog>
  );
}

function ApproveDialog({ businessName, verified, total }: { businessName: string; verified: number; total: number }) {
  const id = useId();
  const allVerified = verified === total;
  return (
    <AdminDialog
      trigger={
        <AdminButton icon={Check} variant="primary" className="w-full">
          Approve
        </AdminButton>
      }
      title="Approve this application?"
      description={`${businessName} is opened as a company on Sanchara and the applicant is invited to set up their account.`}
      footer={
        <>
          <CancelButton />
          <AdminButton icon={Check} variant="primary" placeholder>
            Approve
          </AdminButton>
        </>
      }
    >
      <p
        className={
          allVerified
            ? "rounded-[10px] bg-admin-success-soft px-3 py-2.5 text-[12px] font-medium text-admin-success"
            : "rounded-[10px] bg-admin-warning-soft px-3 py-2.5 text-[12px] font-medium text-admin-warning"
        }
      >
        {verified} of {total} documents verified{allVerified ? "." : " — the rest are approved as submitted."}
      </p>
      <AdminField label="Note for the audit log (optional)" htmlFor={`${id}-note`}>
        <AdminTextarea id={`${id}-note`} placeholder="Anything the next reviewer should know" />
      </AdminField>
      <PendingNote />
    </AdminDialog>
  );
}

const REJECT_REASONS = ["Invalid or unreadable documents", "Ownership not proven", "Duplicate of an existing company", "Business type not eligible", "Other"];

function RejectDialog() {
  const id = useId();
  return (
    <AdminDialog
      trigger={
        <AdminButton icon={X} variant="danger" className="w-full">
          Reject
        </AdminButton>
      }
      title="Reject this application?"
      description="The applicant is told the reason and can resubmit with corrected details."
      footer={
        <>
          <CancelButton />
          <AdminButton icon={X} variant="danger" placeholder>
            Reject
          </AdminButton>
        </>
      }
    >
      <AdminField label="Reason" htmlFor={`${id}-reason`}>
        <AdminSelect id={`${id}-reason`} defaultValue={REJECT_REASONS[0]}>
          {REJECT_REASONS.map((reason) => (
            <option key={reason}>{reason}</option>
          ))}
        </AdminSelect>
      </AdminField>
      <AdminField label="Details shown to the applicant (required)" htmlFor={`${id}-details`}>
        <AdminTextarea id={`${id}-details`} required placeholder="What needs to change before they resubmit" />
      </AdminField>
      <PendingNote />
    </AdminDialog>
  );
}

function HoldDialog() {
  const id = useId();
  return (
    <AdminDialog
      trigger={
        <AdminButton icon={CirclePause} className="w-full">
          Hold
        </AdminButton>
      }
      title="Put this application on hold?"
      description="Hidden from the applicant. The SLA clock pauses until the hold is lifted."
      footer={
        <>
          <CancelButton />
          <AdminButton icon={CirclePause} variant="primary" placeholder>
            Put on hold
          </AdminButton>
        </>
      }
    >
      <AdminField label="Reason (required, internal)" htmlFor={`${id}-reason`}>
        <AdminTextarea id={`${id}-reason`} required placeholder="e.g. waiting for the registrar to confirm the company number" />
      </AdminField>
      <PendingNote />
    </AdminDialog>
  );
}
