"use client";

import { useId } from "react";
import { LockOpen, LogOut, MailPlus } from "lucide-react";
import { AdminDialog, AdminDialogClose } from "../components/dialog";
import { AdminField, AdminTextarea } from "../components/form";
import { AdminButton } from "../components/ui";
import type { StaffUserDetail } from "../types";

// The support-safe account actions: resend a pending invite, sign the user
// out everywhere, unlock a locked account. Roles, details and removal stay
// with the company's Owner / Manager; suspension is company-level in
// Accounts & Enforcement. The confirm buttons are placeholders until the
// platform-admin API exists.
// TODO(users): submit each action through a Server Action and record it in
// the audit log.
export function AccountActions({ user }: { user: StaffUserDetail }) {
  const actions = [
    user.status === "invited" ? <ResendInviteDialog key="invite" user={user} /> : null,
    user.status === "locked" ? <UnlockDialog key="unlock" user={user} /> : null,
    user.status === "active" ? <ForceLogoutDialog key="logout" user={user} /> : null,
  ].filter(Boolean);

  if (actions.length === 0) return null;
  return (
    <div className="flex flex-col gap-2" role="group" aria-label="Account actions">
      {actions}
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

function ResendInviteDialog({ user }: { user: StaffUserDetail }) {
  return (
    <AdminDialog
      trigger={
        <AdminButton icon={MailPlus} variant="primary" className="w-full">
          Resend invite
        </AdminButton>
      }
      title="Resend the invitation?"
      description={`A fresh activation link is emailed to ${user.email}. Earlier links stop working.`}
      footer={
        <>
          <CancelButton />
          <AdminButton icon={MailPlus} variant="primary" placeholder>
            Send invite
          </AdminButton>
        </>
      }
    >
      <p className="rounded-[10px] bg-admin-muted px-3 py-2.5 text-[12px] text-admin-body">
        Invited by <span className="font-semibold text-admin-heading">{user.invitedBy}</span> for {user.companyName} as {user.role === "front-desk" ? "Front Desk" : user.role === "manager" ? "Manager" : "Owner"}.
      </p>
      <PendingNote />
    </AdminDialog>
  );
}

function ForceLogoutDialog({ user }: { user: StaffUserDetail }) {
  const id = useId();
  const sessions = user.security.activeSessions;
  return (
    <AdminDialog
      trigger={
        <AdminButton icon={LogOut} className="w-full">
          Force logout
        </AdminButton>
      }
      title={`Sign ${user.name} out everywhere?`}
      description={sessions > 0 ? `Ends ${sessions} active ${sessions === 1 ? "session" : "sessions"}. The user signs in again with their usual method.` : "No active sessions right now; any remembered devices are forgotten."}
      footer={
        <>
          <CancelButton />
          <AdminButton icon={LogOut} variant="danger" placeholder>
            Sign out everywhere
          </AdminButton>
        </>
      }
    >
      <AdminField label="Reason (required, internal)" htmlFor={`${id}-reason`}>
        <AdminTextarea id={`${id}-reason`} required placeholder="e.g. owner reported a lost phone" />
      </AdminField>
      <PendingNote />
    </AdminDialog>
  );
}

function UnlockDialog({ user }: { user: StaffUserDetail }) {
  const id = useId();
  return (
    <AdminDialog
      trigger={
        <AdminButton icon={LockOpen} variant="primary" className="w-full">
          Unlock account
        </AdminButton>
      }
      title="Unlock this account?"
      description={`${user.security.failedLogins24h} failed sign-ins in the last 24 hours. The user can sign in again immediately.`}
      footer={
        <>
          <CancelButton />
          <AdminButton icon={LockOpen} variant="primary" placeholder>
            Unlock
          </AdminButton>
        </>
      }
    >
      <AdminField label="Reason (required, internal)" htmlFor={`${id}-reason`}>
        <AdminTextarea id={`${id}-reason`} required placeholder="e.g. identity confirmed with the company owner by phone" />
      </AdminField>
      <PendingNote />
    </AdminDialog>
  );
}
