import type { ReactNode } from "react";

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
