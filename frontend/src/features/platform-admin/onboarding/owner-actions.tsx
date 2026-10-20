"use client";

import { useId } from "react";
import { KeyRound, Mail } from "lucide-react";
import { AdminDialog, AdminDialogClose } from "../components/dialog";
import { AdminField, AdminTextarea } from "../components/form";
import { AdminButton } from "../components/ui";
import type { OnboardingItem } from "../types";

// Row actions for a company whose Owner has not signed in. Confirm buttons
// are placeholders until the platform-admin API exists.

export function ResendEmailDialog({ item }: { item: OnboardingItem }) {
  return (
    <AdminDialog
      trigger={
        <AdminButton icon={Mail} className="h-8 px-2.5 text-[12px]">
          Resend<span className="sr-only"> sign-in email</span>
        </AdminButton>
      }
      title="Resend the sign-in details?"
      description={`An email with the owner-portal link and the current temporary password goes to ${item.ownerEmail}. Only the Owner should receive it.`}
      footer={
        <>
          <CancelButton />
          <AdminButton icon={Mail} variant="primary" placeholder>
            Send email
          </AdminButton>
        </>
      }
    >
      <p className="rounded-[10px] bg-admin-muted px-3 py-2.5 text-[12px] leading-snug text-admin-body">
        {item.companyName} · {item.ownerName}. The current credentials stay valid until their expiry; nothing is changed.
      </p>
      <PendingNote />
    </AdminDialog>
  );
}

export function RegenerateDialog({ item }: { item: OnboardingItem }) {
  const id = useId();
  return (
    <AdminDialog
      trigger={
        <AdminButton icon={KeyRound} className="h-8 px-2.5 text-[12px]">
          Regenerate<span className="sr-only"> credentials</span>
        </AdminButton>
      }
      title="Regenerate the Owner's credentials?"
      description={`The current link and temporary password stop working. New ones, valid for 72 hours, are issued and emailed to ${item.ownerEmail}.`}
      footer={
        <>
          <CancelButton />
          <AdminButton icon={KeyRound} variant="primary" placeholder>
            Regenerate and email
          </AdminButton>
        </>
      }
    >
      <p className="rounded-[10px] bg-admin-muted px-3 py-2.5 text-[12px] leading-snug text-admin-body">
        {item.companyName} · {item.ownerName}. The new password is shown to you once after regeneration, with a CSV, exactly as at creation.
      </p>
      <AdminField label="Note for the audit log (optional)" htmlFor={`${id}-note`}>
        <AdminTextarea id={`${id}-note`} placeholder="e.g. Owner reported the email never arrived" />
      </AdminField>
      <PendingNote />
    </AdminDialog>
  );
}

function CancelButton() {
  return (
    <AdminDialogClose asChild>
      <AdminButton>Cancel</AdminButton>
    </AdminDialogClose>
  );
}

function PendingNote() {
  return <p className="text-[11px] text-admin-muted-text">Connects to the API in a later step.</p>;
}
