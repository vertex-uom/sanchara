"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Popover } from "radix-ui";
import { DayPicker, type ClassNames, type Matcher } from "react-day-picker";
import { formatDateOnly, isIsoDate, isoDate } from "@/lib/format/dates";
import { cn } from "@/lib/utils";
import { FOCUS_SCOPE } from "@/components/ui/focus-scope";

// Calendar dates only: "YYYY-MM-DD" ↔ a local-midnight Date, so the picker
// never shifts a day across time zones.
function toPickerDate(value: string) {
  return new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10)));
}

function fromPickerDate(date: Date) {
  return isoDate(date.getFullYear(), date.getMonth(), date.getDate());
}

const CALENDAR_CLASSES: Partial<ClassNames> = {
  root: "p-3 text-sm text-foreground",
  months: "relative",
  month_caption: "flex h-11 md:h-9 items-center justify-center font-semibold",
  nav: "absolute inset-x-0 top-0 flex justify-between",
  button_previous: "focus-ring inline-flex size-11 md:size-9 items-center justify-center rounded-md hover:bg-office-chip disabled:opacity-40",
  button_next: "focus-ring inline-flex size-11 md:size-9 items-center justify-center rounded-md hover:bg-office-chip disabled:opacity-40",
  chevron: "size-4 fill-office-icon",
  month_grid: "mt-2 border-collapse",
  weekday: "size-11 md:size-9 text-xs font-medium text-office-muted",
  day: "size-11 md:size-9 p-0 text-center",
  day_button: "focus-ring size-11 md:size-9 rounded-md hover:bg-office-chip",
  selected: "[&>button]:bg-brand-tropical [&>button]:font-semibold [&>button]:text-white [&>button]:hover:bg-brand-tropical",
  today: "font-bold text-brand-tropical",
  outside: "text-office-muted",
  disabled: "[&>button]:cursor-not-allowed [&>button]:opacity-35 [&>button]:hover:bg-transparent",
};

type DateFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  // Colombo "today", highlighted in the calendar.
  today: string;
  // Days before this ("YYYY-MM-DD") can't be picked.
  minDate?: string;
  error?: string;
};

// Labelled date button that opens a calendar popover.
export function DateField({ id, label, value, onChange, today, minDate, error }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const valid = isIsoDate(value);
  const errorId = `${id}-error`;
  const disabled: Matcher | undefined = minDate ? { before: toPickerDate(minDate) } : undefined;

  return (
    <div className="flex flex-col">
      <span id={`${id}-label`} className="mb-1.5 text-xs font-medium text-office-label">
        {label}
      </span>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            id={id}
            type="button"
            aria-labelledby={`${id}-label ${id}`}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "focus-ring inline-flex h-11 w-full min-w-36 items-center gap-2 rounded-lg border bg-card px-3 text-sm whitespace-nowrap text-foreground md:h-10",
              error ? "border-office-danger" : "border-border",
            )}
          >
            <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-office-icon" />
            {valid ? formatDateOnly(value) : "Choose a date"}
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={6}
            collisionPadding={16}
            className={cn(FOCUS_SCOPE, "z-50 rounded-xl border border-border bg-popover shadow-lg")}
          >
            <DayPicker
              mode="single"
              required
              autoFocus
              selected={valid ? toPickerDate(value) : undefined}
              defaultMonth={toPickerDate(valid ? value : today)}
              today={toPickerDate(today)}
              disabled={disabled}
              weekStartsOn={1}
              showOutsideDays
              classNames={CALENDAR_CLASSES}
              onSelect={(date: Date | undefined) => {
                if (!date) return;
                onChange(fromPickerDate(date));
                setOpen(false);
              }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {error ? (
        <p id={errorId} className="mt-1 text-xs font-medium text-office-danger-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
