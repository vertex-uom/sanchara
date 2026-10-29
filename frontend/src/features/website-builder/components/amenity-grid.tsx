"use client";

import { useState, type KeyboardEvent } from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type AmenityGridProps = {
  options: string[];
  selected: string[];
  onToggle: (amenity: string) => void;
  // A new option typed by the user; the form adds it and ticks it. Leave out
  // for a fixed list (no "+ Add" button).
  onAdd?: (amenity: string) => void;
  addLabel?: string;
};

// Checkbox tiles in three columns, plus an optional "+ Add a custom amenity".
export function AmenityGrid({
  options,
  selected,
  onToggle,
  onAdd,
  addLabel = "Add a custom amenity",
}: AmenityGridProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  function commit() {
    const value = draft.trim();
    if (
      value &&
      !options.some((option) => option.toLowerCase() === value.toLowerCase())
    ) {
      onAdd?.(value);
    }
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
    <div>
      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((amenity) => {
          const on = selected.includes(amenity);
          return (
            <li key={amenity}>
              <label
                className={cn(
                  "flex h-11 cursor-pointer items-center gap-3 rounded-lg border-[1.5px] px-3.5 text-sm transition-colors has-focus-visible:ring-2 has-focus-visible:ring-office-primary",
                  on
                    ? "border-brand-cyan bg-[#f8fcfd] font-semibold text-office-icon"
                    : "border-office-meter-track bg-card text-office-icon hover:border-brand-cyan/60",
                )}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => onToggle(amenity)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-4.5 shrink-0 items-center justify-center rounded border",
                    on
                      ? "border-office-primary bg-office-primary text-white"
                      : "border-office-muted/50 bg-card",
                  )}
                >
                  {on ? <Check className="size-3" strokeWidth={3} /> : null}
                </span>
                {amenity}
              </label>
            </li>
          );
        })}
      </ul>
      {onAdd ? (
        <div className="mt-4">
          {adding ? (
            <input
              autoFocus
              value={draft}
              maxLength={40}
              aria-label={addLabel}
              placeholder="Type and press Enter"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKey}
              onBlur={commit}
              className="h-9 w-60 rounded-full border border-dashed border-office-primary bg-card px-4 text-sm text-office-icon outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-office-primary/60 bg-card px-4 text-sm font-semibold text-office-primary hover:bg-office-tint-teal"
            >
              <Plus aria-hidden="true" className="size-4" />
              {addLabel}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
