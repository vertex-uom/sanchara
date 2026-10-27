import type { ComponentProps, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { fieldClass } from "@/components/ui/field";
import { cn } from "@/lib/utils";

// Fields for the "Edit settings" forms, and the read-only list the tabs show first.

export function describedBy(id: string, error?: string, extra?: string) {
  const ids = [extra, error ? `${id}-error` : null].filter(Boolean).join(" ");
  return { "aria-invalid": error ? true : undefined, "aria-describedby": ids || undefined };
}

type FieldProps = { id: string; label: string; required?: boolean; hint?: string; error?: string; className?: string; children: ReactNode };

export function Field({ id, label, required = false, hint, error, className, children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
        {required ? <span aria-hidden="true"> *</span> : <span className="font-normal text-office-muted"> (optional)</span>}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-office-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-office-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type TextInputProps = Omit<ComponentProps<"input">, "onChange" | "value"> & {
  id: string;
  value: string;
  onValue: (value: string) => void;
  error?: string;
  hint?: boolean;
};

export function TextInput({ id, value, onValue, error, hint = false, className, ...props }: TextInputProps) {
  return (
    <input
      id={id}
      value={value}
      onChange={(event) => onValue(event.target.value)}
      {...describedBy(id, error, hint ? `${id}-hint` : undefined)}
      className={cn(fieldClass, "px-4 placeholder:text-office-muted aria-invalid:border-office-danger", className)}
      {...props}
    />
  );
}

type SelectProps = {
  id: string;
  name: string;
  value: string;
  options: { value: string; label: string }[];
  onValue: (value: string) => void;
  error?: string;
};

export function Select({ id, name, value, options, onValue, error }: SelectProps) {
  return (
    <div className="relative">
      <select
        id={id}
        name={name}
        value={value}
        onChange={(event) => onValue(event.target.value)}
        {...describedBy(id, error)}
        className={cn(fieldClass, "cursor-pointer appearance-none pr-10 pl-4 aria-invalid:border-office-danger")}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-office-icon" />
    </div>
  );
}

type TextAreaProps = { id: string; name: string; value: string; onValue: (value: string) => void; max: number; rows?: number; error?: string };

// With a live "used/max" counter in the corner.
export function TextArea({ id, name, value, onValue, max, rows = 3, error }: TextAreaProps) {
  return (
    <div className="relative">
      <textarea
        id={id}
        name={name}
        rows={rows}
        maxLength={max}
        value={value}
        onChange={(event) => onValue(event.target.value)}
        {...describedBy(id, error, `${id}-count`)}
        className="focus-ring block w-full resize-y rounded-md border border-border bg-card px-4 pt-3 pb-7 text-sm text-foreground aria-invalid:border-office-danger"
      />
      <span id={`${id}-count`} className="pointer-events-none absolute right-3 bottom-2 text-xs text-office-muted">
        {value.length}/{max}
        <span className="sr-only"> characters used</span>
      </span>
    </div>
  );
}

// value: "" for not set. Optional fields read "Not set".
export type DetailRow = { label: string; value: ReactNode | null; wide?: boolean };

export function DetailList({ rows }: { rows: DetailRow[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className={row.wide ? "sm:col-span-2" : undefined}>
          <dt className="text-sm text-office-muted">{row.label}</dt>
          <dd className={cn("mt-1 text-sm break-words", row.value ? "font-medium text-foreground" : "text-office-muted italic")}>
            {row.value || "Not set"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-semibold tracking-wide text-office-label uppercase">{children}</h3>;
}
