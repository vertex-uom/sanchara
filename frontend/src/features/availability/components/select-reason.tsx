"use client";

import { useWatch, type Control, type UseFormRegister } from "react-hook-form";
import { cn } from "@/lib/utils";
import { BLOCK_NOTE_MAX } from "../constants";
import { BLOCK_REASON_LABELS, BLOCK_REASONS } from "../results";
import type { BlockFormValues } from "../validation";
import { StepHeading } from "./step-heading";

type SelectReasonProps = {
  control: Control<BlockFormValues>;
  register: UseFormRegister<BlockFormValues>;
  noteError?: string;
};

// Step 3 of Block dates: reason radios and an optional note with a counter.
export function SelectReason({ control, register, noteError }: SelectReasonProps) {
  const note = useWatch({ control, name: "note" }) ?? "";
  // Initial tick for the server render; react-hook-form owns it after that.
  const reason = useWatch({ control, name: "reason" });

  return (
    <section aria-labelledby="block-step-reason" className="flex flex-col gap-3">
      <StepHeading step={3} id="block-step-reason">
        Reason
      </StepHeading>

      <div role="radiogroup" aria-labelledby="block-step-reason" className="flex flex-wrap gap-x-5 gap-y-2">
        {BLOCK_REASONS.map((option) => (
          <label key={option} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-foreground md:min-h-0">
            <input
              type="radio"
              value={option}
              defaultChecked={option === reason}
              {...register("reason")}
              className="focus-ring size-4 shrink-0 cursor-pointer accent-brand-tropical"
            />
            {BLOCK_REASON_LABELS[option]}
          </label>
        ))}
      </div>

      <div
        className={cn(
          "rounded-lg border bg-card focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--focus-ring)",
          noteError ? "border-office-danger" : "border-border",
        )}
      >
        <label htmlFor="block-note" className="sr-only">
          Note (optional)
        </label>
        <textarea
          id="block-note"
          rows={3}
          maxLength={BLOCK_NOTE_MAX}
          placeholder="Add a note (optional)"
          aria-describedby={noteError ? "block-note-count block-note-error" : "block-note-count"}
          {...register("note")}
          className="block w-full resize-none rounded-t-lg bg-transparent px-3 pt-2.5 text-sm text-foreground outline-none placeholder:text-office-muted"
        />
        <p id="block-note-count" className="px-3 pb-2 text-right text-xs text-office-muted">
          {note.length}/{BLOCK_NOTE_MAX}
          <span className="sr-only"> characters</span>
        </p>
      </div>
      {noteError ? (
        <p id="block-note-error" className="text-xs font-medium text-office-danger-text">
          {noteError}
        </p>
      ) : null}
    </section>
  );
}
