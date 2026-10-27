import type { ReactNode } from "react";

export const dialogInputClass =
  "focus-ring h-11 w-full rounded-md border border-border bg-card px-4 text-sm text-foreground placeholder:text-office-muted aria-invalid:border-office-danger md:h-10";

// Label, field and error for the rates dialogs.
export function DialogField({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-office-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
