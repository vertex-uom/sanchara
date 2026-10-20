"use client";

import { useActionState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { withReturnTo } from "@/lib/auth/return-to";
import { signIn } from "../actions";
import { initialFormState } from "../form-state";
import { signInSchema } from "../schema";
import { FormMessage, lightButtonClass, OrDivider, PasswordField, SubmitButton, TextField } from "./form-controls";
import { GoogleButton } from "./google-button";
import { useAuthForm } from "./use-auth-form";

const linkClass = "focus-ring rounded font-semibold text-brand-cyan-light underline-offset-4 hover:underline";

// `notice`: a message from the URL, e.g. after a password reset.
export function SignInForm({ returnTo, notice }: { returnTo: string | null; notice: { text: string; tone: "error" | "info" } | null }) {
  const [state, action, pending] = useActionState(signIn, initialFormState);
  const { formRef, errors, onSubmit, onBlur } = useAuthForm(signInSchema, state);

  return (
    <div className="space-y-4">
      <form ref={formRef} action={action} onSubmit={onSubmit} onBlur={onBlur} noValidate className="space-y-3.5">
        {state.message ? <FormMessage message={state.message} /> : <FormMessage message={notice?.text} tone={notice?.tone} />}
        {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
        <TextField
          id="signin-email"
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
        <PasswordField
          id="signin-password"
          name="password"
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password}
          required
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <label className="flex items-center gap-2.5 text-white">
            <input type="checkbox" name="rememberMe" className="focus-ring size-4 accent-brand-cyan" />
            Remember me
          </label>
          <Link href="/forgot-password" className={linkClass}>
            Forgot password?
          </Link>
        </div>
        <SubmitButton pending={pending} pendingLabel="Signing in…">
          Sign in
        </SubmitButton>
      </form>

      <Link href={withReturnTo("/sign-up", returnTo)} className={lightButtonClass}>
        Create account
      </Link>
      <OrDivider />
      <GoogleButton label="Continue with Google" returnTo={returnTo} />

      <p className="text-center text-sm text-white/90">
        Don&apos;t have an account?{" "}
        <Link href={withReturnTo("/sign-up", returnTo)} className={linkClass}>
          Sign up
        </Link>
      </p>
    </div>
  );
}
