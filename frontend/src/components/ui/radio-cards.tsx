import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type RadioCardOption = {
  value: string;
  label: string;
  description: ReactNode;
  icon: LucideIcon;
  // Shown but not selectable; say why in the description.
  disabled?: boolean;
};

type RadioCardsProps = {
  name: string;
  legend: string;
  options: RadioCardOption[];
  defaultValue: string;
  error?: string;
};

// Radio group drawn as cards. The native radio is visually hidden; the card
// shows its state with a border, a filled dot and the focus outline.
export function RadioCards({ name, legend, options, defaultValue, error }: RadioCardsProps) {
  const errorId = `${name}-error`;
  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="mb-3 text-sm font-medium">{legend}</legend>
      <div className="space-y-4">
        {options.map(({ value, label, description, icon: Icon, disabled = false }) => (
          <label
            key={value}
            className={cn(
              "group flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 transition-colors has-checked:border-office-chart-bright has-checked:bg-background has-checked:ring-1 has-checked:ring-office-chart-bright has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-office-primary motion-reduce:transition-none",
              disabled ? "cursor-not-allowed bg-office-chip" : "cursor-pointer",
            )}
          >
            <Icon aria-hidden="true" className="size-7 shrink-0 text-office-icon" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{label}</span>
              <span className="block text-sm text-office-muted">{description}</span>
            </span>
            <input
              type="radio"
              name={name}
              value={value}
              disabled={disabled}
              defaultChecked={value === defaultValue}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-office-muted group-has-checked:border-office-primary"
            >
              <span className="size-2.5 rounded-full bg-office-primary opacity-0 group-has-checked:opacity-100" />
            </span>
          </label>
        ))}
      </div>
      {error ? (
        <p id={errorId} className="mt-2 text-sm text-office-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
