import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Text, date and select fields in Back Office filter cards. Phones get 44px targets.
export const fieldClass = "focus-ring h-11 w-full rounded-md border border-border bg-card text-sm text-foreground md:h-10";

type NativeSelectProps = {
  id: string;
  name: string;
  // Visible above the field, or for screen readers only when the options say it ("All roles").
  label: string;
  labelHidden?: boolean;
  defaultValue: string;
  options: { value: string; label: string }[];
  className?: string;
  // Optional, for client callers (the value itself stays uncontrolled).
  disabled?: boolean;
  onChange?: (value: string) => void;
  title?: string;
};

// Native <select> with the design's chevron; works in a plain GET form.
export function NativeSelect({
  id,
  name,
  label,
  labelHidden = false,
  defaultValue,
  options,
  className,
  disabled,
  onChange,
  title,
}: NativeSelectProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelHidden ? "sr-only" : "mb-2 block text-sm text-office-label"}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          name={name}
          defaultValue={defaultValue}
          disabled={disabled}
          title={title}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          className={cn(fieldClass, "cursor-pointer appearance-none pr-10 pl-4 disabled:cursor-not-allowed disabled:opacity-50")}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-office-icon"
        />
      </div>
    </div>
  );
}
