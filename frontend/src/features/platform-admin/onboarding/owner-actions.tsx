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
        <AdminButton icon={Mail} className="h-8 px-2.5 text-xs">
          Resend<span className="sr-only"> sign-in email</span>
        </AdminButton>
      }
      title="Resend the sign-in details?"
      description={`A new invite link is emailed to ${item.ownerEmail}; the current link stops working. Only the Owner receives it.`}
      footer={
        <>
          <CancelButton />
          <AdminButton icon={Mail} variant="primary" placeholder>
            Send email
          </AdminButton>
        </>
      }
    >
      <p className="rounded-[10px] bg-admin-muted px-3 py-2.5 text-xs leading-snug text-admin-body">
        {item.companyName} · {item.ownerName}. The link is never shown to you.
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
        <AdminButton icon={KeyRound} className="h-8 px-2.5 text-xs">
          Regenerate<span className="sr-only"> credentials</span>
        </AdminButton>
      }
      title="Regenerate the Owner's credentials?"
      description={`The current link stops working. A new one, valid for 72 hours, is emailed to ${item.ownerEmail}.`}
      footer={
        <>
          <CancelButton />
          <AdminButton icon={KeyRound} variant="primary" placeholder>
            Regenerate and email
          </AdminButton>
        </>
      }
    >
      <p className="rounded-[10px] bg-admin-muted px-3 py-2.5 text-xs leading-snug text-admin-body">
        {item.companyName} · {item.ownerName}. The new link goes to the Owner only and is never shown to you.
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
