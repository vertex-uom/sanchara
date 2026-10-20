"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Eye, EyeOff, Lock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { passwordStrength } from "../password-strength";

const inputShell =
  "flex min-h-12 items-center gap-3 rounded-full border border-white/40 bg-white/10 px-4 transition-colors focus-within:border-brand-cyan-light focus-within:ring-2 focus-within:ring-brand-cyan-light/60 motion-reduce:transition-none";
const inputClass = "w-full min-w-0 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-white/75";
const invalidShell = "border-auth-danger focus-within:border-auth-danger focus-within:ring-auth-danger/60";

type FieldProps = Omit<ComponentProps<"input">, "id" | "name"> & {
  id: string;
  name: string;
  label: string;
  icon: LucideIcon;
  error?: string;
  hint?: ReactNode;
};

function FieldError({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={id} className="mt-1.5 pl-4 text-xs text-auth-danger">
      {error}
    </p>
  ) : null;
}

export function TextField({ id, name, label, icon: Icon, error, hint, className, ...input }: FieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-white">
        {label}
      </label>
      <div className={cn(inputShell, error && invalidShell)}>
        <Icon aria-hidden="true" className="size-4.5 shrink-0 text-white/80" />
        <input
          id={id}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={inputClass}
          {...input}
        />
      </div>
      {hint}
      <FieldError id={errorId} error={error} />
    </div>
  );
}

type PasswordFieldProps = Omit<FieldProps, "icon" | "type"> & {
  // Sign up / reset: show the strength meter (compared against this email).
  strengthFor?: { email: string } | null;
};

// Password input with a show/hide toggle and an optional strength meter.
export function PasswordField({ id, name, label, error, strengthFor, className, onChange, ...input }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const errorId = `${id}-error`;
  const strengthId = `${id}-strength`;
  const describedBy = [error ? errorId : null, strengthFor ? strengthId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-white">
        {label}
      </label>
      <div className={cn(inputShell, "pr-1.5", error && invalidShell)}>
        <Lock aria-hidden="true" className="size-4.5 shrink-0 text-white/80" />
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputClass}
          onChange={(event) => {
            setValue(event.target.value);
            onChange?.(event);
          }}
          {...input}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          className="focus-ring inline-flex size-9 shrink-0 items-center justify-center rounded-full text-white/85 hover:text-white"
        >
          {visible ? <EyeOff aria-hidden="true" className="size-4.5" /> : <Eye aria-hidden="true" className="size-4.5" />}
        </button>
      </div>
      {strengthFor ? <StrengthMeter id={strengthId} password={value} email={strengthFor.email} /> : null}
      <FieldError id={errorId} error={error} />
    </div>
  );
}

const BAR_COLOURS = ["", "bg-brand-blaze", "bg-brand-blaze", "bg-auth-success", "bg-auth-success"];
const LABEL_COLOURS = ["text-auth-danger", "text-auth-danger", "text-white", "text-auth-success", "text-auth-success"];

// Four bars plus a text label; the label carries the meaning, not the colour.
function StrengthMeter({ id, password, email }: { id: string; password: string; email: string }) {
  const { score, label } = passwordStrength(password, email);
  return (
    <div className="mt-2 flex items-center gap-3 px-1">
      <div aria-hidden="true" className="grid flex-1 grid-cols-4 gap-1.5">
        {[1, 2, 3, 4].map((bar) => (
          <span key={bar} className={cn("h-1 rounded-full bg-white/20", bar <= score && BAR_COLOURS[score])} />
        ))}
      </div>
      <p id={id} aria-live="polite" className={cn("min-w-14 text-right text-xs", LABEL_COLOURS[score])}>
        {label ? <span className="sr-only">Password strength: </span> : null}
        {label}
      </p>
    </div>
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
        "rounded-2xl border px-4 py-3 text-sm outline-none",
        tone === "error" ? "border-auth-danger/50 bg-auth-danger/10 text-auth-danger" : "border-white/30 bg-white/10 text-white",
      )}
    >
      {message}
    </p>
  );
}

const primaryClass =
  "focus-ring group relative flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-linear-to-r from-brand-cyan via-brand-deep-teal via-40% to-brand-deep-teal px-6 text-base font-semibold text-white shadow-lg shadow-brand-cyan/25 transition-opacity disabled:cursor-wait disabled:opacity-80 motion-reduce:transition-none";
const lightClass =
  "focus-ring flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-white/85 px-6 text-base font-semibold text-brand-tropical transition-colors hover:bg-white disabled:cursor-wait disabled:opacity-80 motion-reduce:transition-none";

// Disabled while its form submits, which also blocks double submits.
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  icon,
  pending: pendingProp,
}: {
  children: ReactNode;
  pendingLabel: string;
  variant?: "primary" | "light";
  icon?: ReactNode;
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={variant === "primary" ? primaryClass : lightClass}>
      {icon}
      <span>{pending ? pendingLabel : children}</span>
      {variant === "primary" ? (
        <ArrowRight
          aria-hidden="true"
          className="absolute right-5 size-5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
        />
      ) : null}
    </button>
  );
}

export const lightButtonClass = lightClass;

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-white/75">
      <span aria-hidden="true" className="h-px flex-1 bg-white/30" />
      or
      <span aria-hidden="true" className="h-px flex-1 bg-white/30" />
    </div>
  );
}
