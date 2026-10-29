"use client";

import { useActionState } from "react";
import Link from "next/link";
import { portalPath, signInPath, type StaffPortal } from "@/lib/auth/staff";
import { useAuthForm } from "@/lib/forms/use-auth-form";
import { requestStaffPasswordReset, resetStaffPassword } from "../actions";
import { initialFormState } from "../form-state";
import { forgotPasswordSchema, PASSWORD_MIN, resetPasswordSchema } from "../schema";
import { FormMessage, linkClass, PasswordField, SubmitButton, TextField } from "./controls";

function BackToSignIn({ portal }: { portal: StaffPortal }) {
  return (
    <p className="text-center text-sm text-office-muted">
      Remembered it?{" "}
      <Link href={signInPath(portal)} className={linkClass}>
        Back to sign in
      </Link>
    </p>
  );
}

// Same confirmation for every email, so the page never reveals who has an account.
export function ForgotPasswordForm({ portal }: { portal: StaffPortal }) {
  const [state, action, pending] = useActionState(requestStaffPasswordReset, initialFormState);
  const { formRef, errors, onSubmit, onBlur } = useAuthForm(forgotPasswordSchema, state);

  if (state.sent) {
    return (
      <div className="space-y-5">
        <FormMessage
          tone="info"
          message={`If an account here uses ${state.values?.email ?? "that email"}, we've sent it a link to choose a new password. The link expires in 30 minutes.`}
        />
        <BackToSignIn portal={portal} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form ref={formRef} action={action} onSubmit={onSubmit} onBlur={onBlur} noValidate className="space-y-4">
        <FormMessage message={state.message} />
        <input type="hidden" name="portal" value={portal} />
        <TextField
          id="forgot-email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          inputMode="email"
          defaultValue={state.values?.email}
          error={errors.email}
          required
        />
        <SubmitButton pending={pending} pendingLabel="Sending link…">
          Send reset link
        </SubmitButton>
      </form>
      <BackToSignIn portal={portal} />
    </div>
  );
}

export function ResetPasswordForm({ portal, token }: { portal: StaffPortal; token: string }) {
  const [state, action, pending] = useActionState(resetStaffPassword, initialFormState);
  const { formRef, errors, onSubmit, onBlur } = useAuthForm(resetPasswordSchema, state);
  const problem = state.message ?? errors.token ?? null;

  return (
    <div className="space-y-5">
      <form ref={formRef} action={action} onSubmit={onSubmit} onBlur={onBlur} noValidate className="space-y-4">
        <FormMessage message={problem} />
        <input type="hidden" name="portal" value={portal} />
        <input type="hidden" name="token" value={token} />
        <PasswordField
          id="reset-password"
          name="newPassword"
          label="New password"
          autoComplete="new-password"
          hint={`At least ${PASSWORD_MIN} characters.`}
          error={errors.newPassword}
          required
        />
        <SubmitButton pending={pending} pendingLabel="Saving…">
          Save new password
        </SubmitButton>
      </form>
      {problem ? (
        <p className="text-center text-sm">
          <Link href={portalPath(portal, "/forgot-password")} className={linkClass}>
            Request a new link
          </Link>
        </p>
      ) : (
        <BackToSignIn portal={portal} />
      )}
    </div>
  );
}
