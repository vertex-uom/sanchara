import type { ComponentProps, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";

export const inputClass =
  "focus-ring h-11 w-full rounded-lg border border-office-meter-track bg-card px-3.5 text-sm text-foreground placeholder:text-office-muted/70";

export const formCardClass =
  "rounded-2xl border border-office-meter-track bg-card p-5 shadow-[0_4px_16px_rgb(15_107_110/0.06)] sm:p-6";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
};

// Label row (with an optional hint on the right) above a template form control.
export function Field({
  id,
  label,
  hint,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-office-icon">
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </label>
        {hint ? (
          <span className="text-xs text-office-muted">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

type SelectInputProps = Omit<ComponentProps<"select">, "children"> & {
  options: string[];
  placeholder?: string;
};

// Native <select> with the design's chevron.
export function SelectInput({
  options,
  placeholder,
  className,
  value,
  ...props
}: SelectInputProps) {
  return (
    <div className="relative">
      <select
        value={value}
        className={cn(
          inputClass,
          "cursor-pointer appearance-none pr-10",
          !value && "text-office-muted",
          className,
        )}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-office-icon"
      />
    </div>
  );
}

type AffixInputProps = ComponentProps<"input"> & {
  prefix?: string;
  suffix?: string;
};

// Text box with a fixed unit before or after the value ("LKR", "m²").
export function AffixInput({
  prefix,
  suffix,
  className,
  ...props
}: AffixInputProps) {
  return (
    <div
      className={cn(
        "flex h-11 items-center gap-2 rounded-lg border border-office-meter-track bg-card px-3.5 has-focus-visible:ring-2 has-focus-visible:ring-office-primary",
        className,
      )}
    >
      {prefix ? (
        <span className="shrink-0 text-sm text-office-muted">{prefix}</span>
      ) : null}
      <input
        className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-office-muted/70"
        {...props}
      />
      {suffix ? (
        <span className="shrink-0 text-sm text-office-muted">{suffix}</span>
      ) : null}
    </div>
  );
}

type ToggleRowProps = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

// Setting with a title, one line of help and an on/off switch on the right.
export function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p
          id={`${id}-label`}
          className="text-sm font-semibold text-office-icon"
        >
          {label}
        </p>
        <p id={`${id}-description`} className="text-xs text-office-muted">
          {description}
        </p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-description`}
        onClick={() => onChange(!checked)}
        className={cn(
          "focus-ring relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-office-primary" : "bg-office-meter-track",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "size-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none",
            checked ? "translate-x-[1.375rem]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
