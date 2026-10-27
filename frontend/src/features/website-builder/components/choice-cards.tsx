"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

export type ChoiceOption<T extends string> = {
  value: T;
  label: string;
  description: string;
  icon?: LucideIcon;
  badge?: string;
};

type ChoiceCardsProps<T extends string> = {
  name: string;
  legend: string;
  // Visually hidden when the section heading already says it.
  legendHidden?: boolean;
  required?: boolean;
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

// Controlled radio group drawn as stacked cards: dot, optional icon, text,
// optional badge. The chosen card takes the cyan "selected" style.
export function ChoiceCards<T extends string>({
  name,
  legend,
  legendHidden,
  required,
  options,
  value,
  onChange,
}: ChoiceCardsProps<T>) {
  return (
    <fieldset>
      <legend
        className={cn(
          legendHidden
            ? "sr-only"
            : "mb-2 text-sm font-semibold text-office-icon",
        )}
      >
        {legend}
        {required ? <span aria-hidden="true"> *</span> : null}
      </legend>
      <div className="flex flex-col gap-3">
        {options.map(
          ({ value: option, label, description, icon: Icon, badge }) => {
            const on = option === value;
            return (
              <label
                key={option}
                className={cn(
                  "flex cursor-pointer items-center gap-4 rounded-xl border-[1.5px] px-4 py-3.5 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-office-primary motion-reduce:transition-none",
                  on
                    ? "border-brand-cyan bg-[#f8fcfd]"
                    : "border-office-meter-track bg-card hover:border-brand-cyan/60",
                )}
              >
                <input
                  type="radio"
                  name={name}
                  value={option}
                  checked={on}
                  onChange={() => onChange(option)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                    on ? "border-office-primary" : "border-office-muted/50",
                  )}
                >
                  {on ? (
                    <span className="size-2.5 rounded-full bg-office-primary" />
                  ) : null}
                </span>
                {Icon ? (
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-office-chip text-office-icon">
                    <Icon aria-hidden="true" className="size-[18px]" />
                  </span>
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-office-icon">
                    {label}
                  </span>
                  <span className="block text-xs text-office-muted">
                    {description}
                  </span>
                </span>
                {badge ? (
                  <span className="hidden shrink-0 rounded-full bg-office-tint-teal px-2 py-0.5 text-xs font-medium text-office-primary sm:inline">
                    {badge}
                  </span>
                ) : null}
              </label>
            );
          },
        )}
      </div>
    </fieldset>
  );
}
