"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { isIsoDate, isoDate } from "@/lib/format/dates";
import { cn } from "@/lib/utils";
import { BLOCK_CONFLICT_BEHAVIOUR } from "../constants";
import type { BlockConflict, CreateBlockInput, DateBlock, PropertyUnits } from "../types";
import { blockFormSchema, zodResolver, type BlockFormValues } from "../validation";
import { useBlockPanel } from "./block-panel";
import { ConflictBox } from "./conflict-box";
import { SelectDates } from "./select-dates";
import { SelectReason } from "./select-reason";
import { SelectUnits } from "./select-units";

const RESOLVER = zodResolver(blockFormSchema);

// The block starts on the opening day and runs this many more days.
const DEFAULT_BLOCK_EXTRA_DAYS = 2;

// Wait for the user to stop clicking before asking the API about conflicts.
const CONFLICT_CHECK_DELAY_MS = 300;

type CheckInput = [unitIds: string[], startDate: string, endDate: string];

function errorMessage(error: unknown) {
  return typeof error === "object" && error !== null && "message" in error && typeof error.message === "string"
    ? error.message
    : "The block couldn't be saved. Try again.";
}

type BlockDatesFormProps = {
  // Null while loading.
  propertyUnits: PropertyUnits | null;
  // Shown instead of the unit list when it couldn't load.
  unitsError?: string;
  // Colombo date ("YYYY-MM-DD").
  today: string;
  conflicts: BlockConflict[];
  onCheckConflicts: (input: CreateBlockInput) => Promise<BlockConflict[]>;
  onClearConflicts: () => void;
  saving: boolean;
  // Rejects with an ApiError when the block can't be saved.
  onCreateBlock: (input: CreateBlockInput) => Promise<DateBlock[]>;
  // After a successful save (refreshes the results).
  onSaved: () => void;
};

// The Block dates steps and Save. Form state lives in react-hook-form; no
// units are selected at first.
export function BlockDatesForm({
  propertyUnits,
  unitsError,
  today,
  conflicts,
  onCheckConflicts,
  onClearConflicts,
  saving,
  onCreateBlock,
  onSaved,
}: BlockDatesFormProps) {
  const toast = useToast();
  const { close } = useBlockPanel();
  const [year, month, day] = today.split("-").map(Number);
  const {
    control,
    register,
    trigger,
    getValues,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BlockFormValues>({
    resolver: RESOLVER,
    defaultValues: {
      unitIds: [],
      startDate: today,
      endDate: isoDate(year, month - 1, day + DEFAULT_BLOCK_EXTRA_DAYS),
      reason: "maintenance",
      note: "",
    },
  });

  const [unitIds, startDate, endDate] = useWatch({ control, name: ["unitIds", "startDate", "endDate"] });
  // A stable key so the check only reruns when units or dates really change.
  const checkKey = JSON.stringify([unitIds, startDate, endDate]);
  // The key whose conflict check has finished; Save waits for it to match.
  const [checkedKey, setCheckedKey] = useState<string | null>(null);
  // The newest key; an older check that finishes late doesn't count.
  const latestKey = useRef(checkKey);
  const [saveError, setSaveError] = useState<string | null>(null);

  const rangeValid = isIsoDate(startDate) && isIsoDate(endDate) && endDate >= startDate;

  const runCheck = useCallback(
    async (key: string) => {
      const [ids, start, end] = JSON.parse(key) as CheckInput;
      const checkable = ids.length > 0 && isIsoDate(start) && isIsoDate(end) && end >= start;
      if (checkable) {
        try {
          await onCheckConflicts({ unitIds: ids, startDate: start, endDate: end, reason: getValues("reason") });
        } catch {
          // Validation failures are already shown inline by the form.
          onClearConflicts();
        }
      } else {
        onClearConflicts();
      }
      if (key === latestKey.current) setCheckedKey(key);
    },
    [getValues, onCheckConflicts, onClearConflicts],
  );

  // Conflict check, debounced, whenever units or dates change.
  useEffect(() => {
    latestKey.current = checkKey;
    // Nothing selected (e.g. a freshly opened drawer): clear old conflicts at once.
    const [ids] = JSON.parse(checkKey) as CheckInput;
    const delay = ids.length > 0 ? CONFLICT_CHECK_DELAY_MS : 0;
    const timer = setTimeout(() => void runCheck(checkKey), delay);
    return () => clearTimeout(timer);
  }, [checkKey, runCheck]);

  const blockedByConflicts = BLOCK_CONFLICT_BEHAVIOUR === "prevent" && conflicts.length > 0;
  const canSave = unitIds.length > 0 && rangeValid && checkedKey === checkKey && !blockedByConflicts && !saving;

  async function save(values: BlockFormValues) {
    setSaveError(null);
    try {
      const created = await onCreateBlock({
        unitIds: values.unitIds,
        startDate: values.startDate,
        endDate: values.endDate,
        reason: values.reason,
        note: values.note.trim() || undefined,
      });
      const count = created.length;
      toast(`Block created for ${count} ${count === 1 ? "unit" : "units"}`);
      reset();
      close();
      onSaved();
    } catch (error) {
      // Someone may have taken a unit since the last check: show why, then check again.
      setSaveError(errorMessage(error));
      setCheckedKey(null);
      void runCheck(checkKey);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    void handleSubmit(save)(event);
  }

  return (
    <form noValidate aria-label="Block dates" onSubmit={onSubmit} className="flex flex-col gap-5">
      {unitsError ? (
        <p role="alert" className="text-sm font-medium text-office-danger-text">
          {unitsError}
        </p>
      ) : (
        <SelectUnits control={control} propertyUnits={propertyUnits} />
      )}
      <SelectDates control={control} trigger={trigger} today={today} />
      <SelectReason control={control} register={register} noteError={errors.note?.message} />
      <ConflictBox conflicts={conflicts} propertyUnits={propertyUnits} />

      <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-col gap-2 bg-card px-4 pt-1 pb-4">
        {saveError ? (
          <p role="alert" className="rounded-lg bg-office-danger-soft px-3 py-2 text-xs font-medium text-office-danger-text">
            {saveError}
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={!canSave}
          aria-busy={saving || undefined}
          className={cn(
            "h-11 w-full gap-2 rounded-lg text-sm font-semibold",
            canSave || saving
              ? "bg-brand-tropical text-white hover:bg-brand-tropical/90"
              : "bg-office-chip text-office-muted disabled:opacity-100",
          )}
        >
          {saving ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : null}
          {saving ? "Saving…" : "Save block"}
        </Button>
      </div>
    </form>
  );
}
