import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Inputs that read as plain text until hovered or focused, so the editor
// looks like the design's detail view. Each has an accessible name.
const inlineClass =
  "focus-ring w-full min-w-0 rounded-md border border-transparent bg-transparent px-1.5 py-0.5 -mx-1.5 text-foreground placeholder:text-office-muted hover:border-border focus:border-office-primary focus:bg-card aria-invalid:border-office-danger";

type InlineInputProps = Omit<ComponentProps<"input">, "aria-label"> & { label: string; error?: string };

export function InlineInput({ id, label, error, className, ...props }: InlineInputProps) {
  return (
    <span className="block min-w-0">
      <input
        id={id}
        aria-label={label}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(inlineClass, className)}
        {...props}
      />
      <FieldError id={`${id}-error`} error={error} />
    </span>
  );
}

export function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <span id={id} className="mt-1 block text-xs font-medium text-office-danger">
      {error}
    </span>
  );
}

type ChipSelectProps = Omit<ComponentProps<"select">, "aria-label" | "onChange"> & {
  label: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
};

// Native <select> drawn as the design's small grey chip.
export function ChipSelect({ label, options, onChange, className, ...props }: ChipSelectProps) {
  return (
    <span className="relative inline-flex">
      <select
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "focus-ring h-7 cursor-pointer appearance-none rounded-md bg-office-chip pr-6 pl-2 text-[0.8125rem] font-medium text-office-label hover:bg-office-pill",
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-1.5 size-3.5 -translate-y-1/2 opacity-70" />
    </span>
  );
}
