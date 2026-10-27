"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type ChipPickerProps = {
  label: string;
  hint?: string;
  options: string[];
  selected: string[];
  max?: number;
  addLabel: string;
  onToggle: (option: string) => void;
  // A new option typed by the user; the form adds it and selects it.
  onAdd: (option: string) => void;
};

const chipClass =
  "focus-ring inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors";

// Toggle chips with an inline "+ Add" box for options not in the list.
export function ChipPicker({
  label,
  hint,
  options,
  selected,
  max,
  addLabel,
  onToggle,
  onAdd,
}: ChipPickerProps) {
  const labelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const full = max !== undefined && selected.length >= max;

  function commit() {
    const value = draft.trim();
    if (
      value &&
      !options.some((option) => option.toLowerCase() === value.toLowerCase())
    )
      onAdd(value);
    setDraft("");
    setAdding(false);
  }

  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape") {
      setDraft("");
      setAdding(false);
    }
  }

  return (
    <div role="group" aria-labelledby={labelId}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span id={labelId} className="text-sm font-semibold text-office-icon">
          {label}
        </span>
        {hint ? (
          <span className="text-xs text-office-muted">{hint}</span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const on = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={on}
              disabled={!on && full}
              onClick={() => onToggle(option)}
              className={cn(
                chipClass,
                on
                  ? "border-brand-cyan bg-[#f8fcfd] text-office-primary"
                  : "border-office-meter-track bg-card text-office-icon hover:border-brand-cyan/60",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {on ? (
                <Check
                  aria-hidden="true"
                  className="size-3.5"
                  strokeWidth={2.5}
                />
              ) : null}
              {option}
            </button>
          );
        })}
        {adding ? (
          <input
            ref={inputRef}
            autoFocus
            value={draft}
            maxLength={30}
            aria-label={addLabel}
            placeholder="Type and press Enter"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKey}
            onBlur={commit}
            className="h-8 w-44 rounded-full border border-dashed border-office-primary bg-card px-3 text-xs text-office-icon outline-none"
          />
        ) : (
          <button
            type="button"
            disabled={full}
            onClick={() => setAdding(true)}
            className={cn(
              chipClass,
              "border-dashed border-office-primary/60 bg-card text-office-primary hover:bg-office-tint-teal disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <Plus aria-hidden="true" className="size-3.5" />
            {addLabel}
          </button>
        )}
      </div>
    </div>
  );
}
