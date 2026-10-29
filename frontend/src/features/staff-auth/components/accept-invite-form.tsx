"use client";

import { useActionState } from "react";
import { STAFF_ROLE_LABELS, type StaffPortal } from "@/lib/auth/staff";
import { useAuthForm } from "@/lib/forms/use-auth-form";
import { acceptStaffInvite } from "../actions";
import { initialFormState } from "../form-state";
import { acceptInviteSchema, PASSWORD_MIN } from "../schema";
import type { InvitePreview } from "../server/invites";
import { FormMessage, PasswordField, RememberMe, SubmitButton, TextField } from "./controls";

export function AcceptInviteForm({ portal, token, invite }: { portal: StaffPortal; token: string; invite: InvitePreview }) {
  const [state, action, pending] = useActionState(acceptStaffInvite, initialFormState);
  const { formRef, errors, onSubmit, onBlur } = useAuthForm(acceptInviteSchema, state);

  return (
    <form ref={formRef} action={action} onSubmit={onSubmit} onBlur={onBlur} noValidate className="space-y-4">
      <p className="text-sm text-office-label">
        Hi {invite.fullName}, you&apos;ve been invited to <span className="font-medium text-foreground">{invite.companyName}</span> as{" "}
        <span className="font-medium text-foreground">{STAFF_ROLE_LABELS[invite.role]}</span>. Choose a password to finish setting up your account.
      </p>
      <FormMessage message={state.message ?? errors.token} />
      <input type="hidden" name="portal" value={portal} />
      <input type="hidden" name="token" value={token} />
      {/* No name: shown for the password manager, never posted. */}
      <TextField id="invite-email" type="email" label="Email" autoComplete="username" value={invite.email} readOnly />
      <PasswordField
        id="invite-password"
        name="password"
        label="Password"
        autoComplete="new-password"
        hint={`At least ${PASSWORD_MIN} characters, and not your email address.`}
        error={errors.password}
        required
      />
      <RememberMe />
      <SubmitButton pending={pending} pendingLabel="Setting up…">
        Set password and sign in
      </SubmitButton>
    </form>
  );
}
