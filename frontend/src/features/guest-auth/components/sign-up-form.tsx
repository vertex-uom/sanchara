"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { MessageSquare, Headphones, User } from "lucide-react";
import { withReturnTo } from "@/lib/auth/return-to";
import { signUp } from "../actions";
import { initialFormState } from "../form-state";
import { signUpSchema } from "../schema";
import { FormMessage, OrDivider, PasswordField, SubmitButton, TextField } from "./form-controls";
import { GoogleButton } from "./google-button";
import { useAuthForm } from "@/lib/forms/use-auth-form";

const linkClass = "focus-ring rounded font-semibold text-brand-cyan-light underline-offset-4 hover:underline";

export function SignUpForm({ returnTo }: { returnTo: string | null }) {
  const [state, action, pending] = useActionState(signUp, initialFormState);
  const { formRef, errors, onSubmit, onBlur, onChange } = useAuthForm(signUpSchema, state);
  // The strength meter warns when the password matches the email.
  const [email, setEmail] = useState(state.values?.email ?? "");

  return (
    <div className="space-y-4">
      <form ref={formRef} action={action} onSubmit={onSubmit} onBlur={onBlur} onChange={onChange} noValidate className="space-y-3.5">
        <FormMessage message={state.message} />
        {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
        <TextField
          id="signup-name"
          name="fullName"
          label="Full name"
          icon={User}
          autoComplete="name"
          placeholder="Your full name"
          defaultValue={state.values?.fullName}
          error={errors.fullName}
          required
        />
        <TextField
          id="signup-email"
          name="email"
          type="email"
          label="Email address"
          icon={MessageSquare}
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state.values?.email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          required
        />
        <TextField
          id="signup-mobile"
          name="mobile"
          type="tel"
          label="Mobile number"
          icon={Headphones}
          autoComplete="tel"
          inputMode="tel"
          placeholder="+94 77 123 4567"
          defaultValue={state.values?.mobile}
          error={errors.mobile}
        />
        <PasswordField
          id="signup-password"
          name="password"
          label="Password"
          autoComplete="new-password"
          placeholder="Create a password"
          strengthFor={{ email }}
          error={errors.password}
          required
        />
        <div>
          <label className="flex items-start gap-2.5 text-sm text-white">
            <input
              type="checkbox"
              name="terms"
              aria-invalid={errors.terms ? true : undefined}
              aria-describedby={errors.terms ? "signup-terms-error" : undefined}
              className="focus-ring mt-0.5 size-4 shrink-0 accent-brand-cyan"
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" className={linkClass}>
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className={linkClass}>
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.terms ? (
            <p id="signup-terms-error" className="mt-1.5 text-xs text-auth-danger">
              {errors.terms}
            </p>
          ) : null}
        </div>
        <SubmitButton pending={pending} pendingLabel="Creating account…">
          Create account
        </SubmitButton>
      </form>

      <OrDivider />
      <GoogleButton label="Sign up with Google" returnTo={returnTo} />

      <p className="text-center text-sm text-white/90">
        Already have an account?{" "}
        <Link href={withReturnTo("/sign-in", returnTo)} className={linkClass}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
