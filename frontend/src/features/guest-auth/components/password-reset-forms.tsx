"use client";

import { useActionState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { requestPasswordReset, resetPassword } from "../actions";
import { initialFormState } from "../form-state";
import { forgotPasswordSchema, resetPasswordSchema } from "../schema";
import { FormMessage, PasswordField, SubmitButton, TextField } from "./form-controls";
import { useAuthForm } from "@/lib/forms/use-auth-form";

const linkClass = "focus-ring rounded font-semibold text-brand-cyan-light underline-offset-4 hover:underline";

function BackToSignIn() {
  return (
    <p className="text-center text-sm text-white/90">
      Remembered it?{" "}
      <Link href="/sign-in" className={linkClass}>
        Back to sign in
      </Link>
    </p>
  );
}

// Same confirmation for every email, so the page never reveals who has an account.
export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initialFormState);
  const { formRef, errors, onSubmit, onBlur } = useAuthForm(forgotPasswordSchema, state);

  if (state.sent) {
    return (
      <div className="space-y-4">
        <FormMessage
          tone="info"
          message={`If an account exists for ${state.values?.email ?? "that email"}, we've sent a link to reset the password. It expires in 30 minutes.`}
        />
        <BackToSignIn />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form ref={formRef} action={action} onSubmit={onSubmit} onBlur={onBlur} noValidate className="space-y-3.5">
        <p className="text-sm text-white/90">Enter your email and we&apos;ll send you a link to choose a new password.</p>
        <FormMessage message={state.message} />
        <TextField
          id="forgot-email"
          name="email"
          type="email"
          label="Email address"
          icon={MessageSquare}
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state.values?.email}
          error={errors.email}
          required
        />
        <SubmitButton pending={pending} pendingLabel="Sending link…">
          Send reset link
        </SubmitButton>
      </form>
      <BackToSignIn />
    </div>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, initialFormState);
  const { formRef, errors, onSubmit, onBlur } = useAuthForm(resetPasswordSchema, state);
  const tokenProblem = errors.token ?? null;

  return (
    <div className="space-y-4">
      <form ref={formRef} action={action} onSubmit={onSubmit} onBlur={onBlur} noValidate className="space-y-3.5">
        <FormMessage message={state.message ?? tokenProblem} />
        <input type="hidden" name="token" value={token} />
        <PasswordField
          id="reset-password"
          name="newPassword"
          label="New password"
          autoComplete="new-password"
          placeholder="Create a new password"
          strengthFor={{ email: "" }}
          error={errors.newPassword}
          required
        />
        <SubmitButton pending={pending} pendingLabel="Saving…">
          Save new password
        </SubmitButton>
      </form>
      {state.message || tokenProblem ? (
        <p className="text-center text-sm text-white/90">
          <Link href="/forgot-password" className={linkClass}>
            Request a new link
          </Link>
        </p>
      ) : (
        <BackToSignIn />
      )}
    </div>
  );
}
