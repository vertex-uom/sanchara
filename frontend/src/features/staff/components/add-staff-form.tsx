"use client";

import { useActionState } from "react";
import { Info } from "lucide-react";
import type { StaffRole } from "@/lib/auth/staff";
import { Button } from "@/components/ui/button";
import { DialogActions } from "@/components/ui/dialog-actions";
import { createStaffAction, type AddStaffState } from "../actions";
import { RoleOptions } from "./role-options";

type AddStaffFormProps = { roles: readonly StaffRole[]; listHref: string };

const inputClass =
  "focus-ring h-11 w-full rounded-md border border-border bg-card px-4 text-sm text-foreground placeholder:text-office-muted aria-invalid:border-office-danger md:h-10";

// Client only for field errors: the Server Action validates and returns them.
export function AddStaffForm({ roles, listHref }: AddStaffFormProps) {
  // Least access by default (the last assignable role, Front Desk).
  const initial: AddStaffState = { error: null, values: { fullName: "", email: "", role: roles[roles.length - 1] } };
  const [state, formAction, pending] = useActionState(createStaffAction, initial);
  const fieldErrors = state.error?.fieldErrors ?? {};
  const formError = state.error && Object.keys(fieldErrors).length === 0 ? state.error.message : null;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="returnTo" value={listHref} />
      {formError ? (
        <p role="alert" className="text-sm font-medium text-office-danger">
          {formError}
        </p>
      ) : null}
      <TextField
        name="fullName"
        label="Full name"
        placeholder="Enter full name"
        autoComplete="name"
        defaultValue={state.values.fullName}
        error={fieldErrors.fullName}
      />
      <TextField
        name="email"
        type="email"
        label="Email"
        placeholder="Enter email address"
        autoComplete="email"
        defaultValue={state.values.email}
        error={fieldErrors.email}
      />
      <RoleOptions legend="Assign role" roles={roles} defaultValue={state.values.role} error={fieldErrors.role} />
      <p className="flex gap-2 text-sm text-office-muted">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-office-icon" />
        Staff sign in with email and password, or with Google.
      </p>
      <DialogActions closeHref={listHref}>
        <Button type="submit" variant="office" disabled={pending} className="h-11 rounded-lg text-base md:h-10">
          {pending ? "Creating…" : "Create account"}
        </Button>
      </DialogActions>
    </form>
  );
}

type TextFieldProps = {
  name: string;
  label: string;
  placeholder: string;
  autoComplete: string;
  defaultValue: string;
  error?: string;
  type?: "text" | "email";
};

function TextField({ name, label, error, type = "text", ...props }: TextFieldProps) {
  const id = `staff-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClass}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-office-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
