"use client";

import { useId } from "react";
import { MailPlus, RotateCcw, UserRoundPlus, UserRoundX } from "lucide-react";
import { AdminDialog, AdminDialogClose } from "../components/dialog";
import { AdminField, AdminInput, AdminTextarea } from "../components/form";
import { AdminButton } from "../components/ui";
import type { AdminAccount } from "../types";

// Account-lifecycle actions for platform-team admins. There is one role, so
// nothing here grants or changes permissions. Confirm buttons are
// placeholders until the platform-admin API exists.
// TODO(admin-users): submit each action through a Server Action and record
// it in the audit log.

const PENDING_NOTE = "Connects to the API in a later step.";
const ROW_BUTTON = "h-[30px] px-2.5 text-[12px]";

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

// The one action that applies to an admin's current status.
export function AdminRowAction({ admin, isCurrentUser }: { admin: AdminAccount; isCurrentUser: boolean }) {
  if (isCurrentUser) return <span className="text-[11px] text-admin-muted-text">Signed in as you</span>;
  switch (admin.status) {
    case "invited":
      return <ResendInviteDialog admin={admin} />;
    case "active":
      return <DeactivateDialog admin={admin} />;
    case "deactivated":
      return <ReactivateDialog admin={admin} />;
  }
}

function ResendInviteDialog({ admin }: { admin: AdminAccount }) {
  return (
    <AdminDialog
      trigger={
        <AdminButton icon={MailPlus} className={ROW_BUTTON}>
          Resend invite
        </AdminButton>
      }
      title="Resend the invitation?"
      description={`A fresh link is emailed to ${admin.email}. Earlier links stop working. The admin sets a password and enrols two-step verification on first sign-in.`}
      footer={
        <>
          <CancelButton />
          <AdminButton icon={MailPlus} variant="primary" placeholder>
            Send invite
          </AdminButton>
        </>
      }
    >
      <PendingNote />
    </AdminDialog>
  );
}

function DeactivateDialog({ admin }: { admin: AdminAccount }) {
  const id = useId();
  return (
    <AdminDialog
      trigger={
        <AdminButton icon={UserRoundX} className={ROW_BUTTON}>
          Deactivate
        </AdminButton>
      }
      title={`Deactivate ${admin.name}?`}
      description="Their sessions end now and they can no longer sign in to this console. The account and its audit history are kept; it can be reactivated later."
      footer={
        <>
          <CancelButton />
          <AdminButton icon={UserRoundX} variant="danger" placeholder>
            Deactivate
          </AdminButton>
        </>
      }
    >
      <AdminField label="Reason (required, recorded in the audit log)" htmlFor={`${id}-reason`}>
        <AdminTextarea id={`${id}-reason`} required placeholder="e.g. left the platform team on 30 Sept" />
      </AdminField>
      <PendingNote />
    </AdminDialog>
  );
}

function ReactivateDialog({ admin }: { admin: AdminAccount }) {
  const id = useId();
  return (
    <AdminDialog
      trigger={
        <AdminButton icon={RotateCcw} className={ROW_BUTTON}>
          Reactivate
        </AdminButton>
      }
      title={`Reactivate ${admin.name}?`}
      description="They can sign in again with their existing password and two-step device. Nothing else is restored or changed."
      footer={
        <>
          <CancelButton />
          <AdminButton icon={RotateCcw} variant="primary" placeholder>
            Reactivate
          </AdminButton>
        </>
      }
    >
      <AdminField label="Reason (required, recorded in the audit log)" htmlFor={`${id}-reason`}>
        <AdminTextarea id={`${id}-reason`} required placeholder="e.g. returned from leave" />
      </AdminField>
      <PendingNote />
    </AdminDialog>
  );
}

// Header action: invite a new platform-team member.
export function InviteAdminDialog() {
  const id = useId();
  return (
    <AdminDialog
      trigger={
        <AdminButton icon={UserRoundPlus} variant="primary">
          Invite admin
        </AdminButton>
      }
      title="Invite a platform admin"
      description="They receive an email to set a password and enrol two-step verification. Every admin has the same Platform Admin access; there are no other roles."
      footer={
        <>
          <CancelButton />
          <AdminButton icon={UserRoundPlus} variant="primary" placeholder>
            Send invite
          </AdminButton>
        </>
      }
    >
      <AdminField label="Full name" htmlFor={`${id}-name`}>
        <AdminInput id={`${id}-name`} required autoComplete="off" placeholder="e.g. Anjali Mendis" />
      </AdminField>
      <AdminField label="Work email" htmlFor={`${id}-email`}>
        <AdminInput id={`${id}-email`} type="email" required autoComplete="off" placeholder="name@sanchara.io" />
      </AdminField>
      <PendingNote />
    </AdminDialog>
  );
}
