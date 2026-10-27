"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, LogIn, Mail, LockKeyhole } from "lucide-react";
import { AdminField, AdminInput } from "../components/form";
import { AdminButton } from "../components/ui";
import { signInAdmin } from "./actions";
import type { AdminSignInState } from "./schema";

const INITIAL: AdminSignInState = {};

// Email + password. Errors come back from the Server Action; focus moves to the
// message or the first invalid field so screen readers hear it.
export function AdminSignInForm() {
  const [state, action, pending] = useActionState(signInAdmin, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state === INITIAL) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-form-message]')?.focus();
  }, [state]);

  return (
    <form ref={formRef} action={action} noValidate className="flex flex-col gap-4">
      {state.message ? (
        <p data-form-message tabIndex={-1} role="alert" className="rounded-[10px] bg-admin-danger-soft px-3 py-2.5 text-[12.5px] text-admin-danger outline-none">
          {state.message}
        </p>
      ) : null}
      <SignInField id="admin-email" label="Email" error={state.fieldErrors?.email}>
        <AdminInput
          id="admin-email"
          name="email"
          type="email"
          icon={Mail}
          autoComplete="username"
          inputMode="email"
          defaultValue={state.email}
          aria-invalid={state.fieldErrors?.email ? true : undefined}
          aria-describedby={state.fieldErrors?.email ? "admin-email-error" : undefined}
          required
        />
      </SignInField>
      <SignInField id="admin-password" label="Password" error={state.fieldErrors?.password}>
        <AdminInput
          id="admin-password"
          name="password"
          type="password"
          icon={LockKeyhole}
          autoComplete="current-password"
          aria-invalid={state.fieldErrors?.password ? true : undefined}
          aria-describedby={state.fieldErrors?.password ? "admin-password-error" : undefined}
          required
        />
      </SignInField>
      <AdminButton type="submit" variant="primary" icon={pending ? Loader2 : LogIn} disabled={pending} aria-busy={pending || undefined} className={pending ? "[&>svg]:animate-spin" : undefined}>
        {pending ? "Signing in…" : "Sign in"}
      </AdminButton>
    </form>
  );
}

function SignInField({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <AdminField label={label} htmlFor={id}>
        <div className={error ? "[&_input]:border-admin-danger" : undefined}>{children}</div>
      </AdminField>
      {error ? (
        <p id={`${id}-error`} className="text-[11px] text-admin-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
