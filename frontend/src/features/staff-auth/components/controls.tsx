"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export const linkClass = "focus-ring rounded font-medium text-office-link underline-offset-4 hover:underline";

const inputClass = cn(fieldClass, "px-3 aria-invalid:border-office-danger read-only:bg-office-header read-only:text-office-muted");

type FieldProps = Omit<ComponentProps<"input">, "id"> & { id: string; label: string; error?: string; hint?: string };

function FieldError({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={id} className="mt-1.5 text-xs text-office-danger-text">
      {error}
    </p>
  ) : null;
}

function describedBy(...ids: (string | false | undefined)[]) {
  return ids.filter(Boolean).join(" ") || undefined;
}

export function TextField({ id, label, error, hint, className, ...input }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm text-office-label">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(error && `${id}-error`, hint && `${id}-hint`)}
        className={inputClass}
        {...input}
      />
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-office-muted">
          {hint}
        </p>
      ) : null}
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

// Password input with a show/hide toggle.
export function PasswordField({ id, label, error, hint, className, ...input }: Omit<FieldProps, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm text-office-label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(error && `${id}-error`, hint && `${id}-hint`)}
          className={cn(inputClass, "pr-12")}
          {...input}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          className="focus-ring absolute top-1/2 right-1 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-office-icon hover:text-foreground"
        >
          {visible ? <EyeOff aria-hidden="true" className="size-4.5" /> : <Eye aria-hidden="true" className="size-4.5" />}
        </button>
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-office-muted">
          {hint}
        </p>
      ) : null}
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

export function RememberMe() {
  return (
    <label className="flex items-center gap-2.5 text-sm text-office-label">
      <input type="checkbox" name="rememberMe" className="focus-ring size-4 accent-office-primary" />
      Keep me signed in
    </label>
  );
}

// Form-level message (errors from the server, or a notice like "password updated").
export function FormMessage({ message, tone = "error" }: { message?: string | null; tone?: "error" | "info" }) {
  if (!message) return null;
  return (
    <p
      data-form-message=""
      tabIndex={-1}
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg px-3 py-2.5 text-sm outline-none",
        tone === "error" ? "bg-office-danger-soft text-office-danger-text" : "bg-office-success-soft text-office-success-text",
      )}
    >
      {message}
    </p>
  );
}

// Disabled while its form submits, which also blocks double submits.
export function SubmitButton({
  children,
  pendingLabel,
  pending: pendingProp,
  variant = "office",
  icon,
}: {
  children: ReactNode;
  pendingLabel: string;
  pending?: boolean;
  variant?: "office" | "outline";
  icon?: ReactNode;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <Button type="submit" variant={variant} disabled={pending} aria-busy={pending || undefined} className="h-11 w-full gap-2 text-sm">
      {pending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : icon}
      {pending ? pendingLabel : children}
    </Button>
  );
}

export function OrDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-office-muted">
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
      {label}
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
    </div>
  );
}
