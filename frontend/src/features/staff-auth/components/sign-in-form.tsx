"use client";

import { useActionState } from "react";
import Link from "next/link";
import { GoogleMark } from "@/components/ui/google-mark";
import { portalPath, type StaffPortal } from "@/lib/auth/staff";
import { useAuthForm } from "@/lib/forms/use-auth-form";
import { signInStaff, startStaffGoogleSignIn } from "../actions";
import { initialFormState } from "../form-state";
import { signInSchema } from "../schema";
import { FormMessage, linkClass, OrDivider, PasswordField, RememberMe, SubmitButton, TextField } from "./controls";

export type Notice = { text: string; tone: "error" | "info" };

// `notice`: a message from the URL, e.g. after a password reset or sign-out.
export function SignInForm({ portal, notice }: { portal: StaffPortal; notice: Notice | null }) {
  const [state, action, pending] = useActionState(signInStaff, initialFormState);
  const { formRef, errors, onSubmit, onBlur } = useAuthForm(signInSchema, state);

  return (
    <div className="space-y-5">
      {/* Existing accounts only: Google never creates a staff account. */}
      <form action={startStaffGoogleSignIn}>
        <input type="hidden" name="portal" value={portal} />
        <SubmitButton variant="outline" pendingLabel="Opening Google…" icon={<GoogleMark />}>
          Continue with Google
        </SubmitButton>
      </form>
      <OrDivider label="or sign in with email" />
      <form ref={formRef} action={action} onSubmit={onSubmit} onBlur={onBlur} noValidate className="space-y-4">
        {state.message ? <FormMessage message={state.message} /> : <FormMessage message={notice?.text} tone={notice?.tone} />}
        <input type="hidden" name="portal" value={portal} />
        <TextField
          id="staff-email"
          name="email"
          type="email"
          label="Email"
          autoComplete="username"
          inputMode="email"
          defaultValue={state.values?.email}
          error={errors.email}
          required
        />
        <PasswordField id="staff-password" name="password" label="Password" autoComplete="current-password" error={errors.password} required />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <RememberMe />
          <Link href={portalPath(portal, "/forgot-password")} className={`${linkClass} text-sm`}>
            Forgot password?
          </Link>
        </div>
        <SubmitButton pending={pending} pendingLabel="Signing in…">
          Sign in
        </SubmitButton>
      </form>
    </div>
  );
}
