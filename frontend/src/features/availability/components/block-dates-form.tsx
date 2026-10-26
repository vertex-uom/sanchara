"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { isIsoDate, isoDate } from "@/lib/format/dates";
import type { BlockConflict, CreateBlockInput, PropertyUnits } from "../types";
import { blockFormSchema, zodResolver, type BlockFormValues } from "../validation";
import { ConflictBox } from "./conflict-box";
import { SelectDates } from "./select-dates";
import { SelectReason } from "./select-reason";
import { SelectUnits } from "./select-units";

const RESOLVER = zodResolver(blockFormSchema);

// The block starts on the opening day and runs this many more days.
const DEFAULT_BLOCK_EXTRA_DAYS = 2;

// Wait for the user to stop clicking before asking the API about conflicts.
const CONFLICT_CHECK_DELAY_MS = 300;

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
};

// The Block dates steps. Form state lives in react-hook-form; no units are
// selected at first.
export function BlockDatesForm({
  propertyUnits,
  unitsError,
  today,
  conflicts,
  onCheckConflicts,
  onClearConflicts,
}: BlockDatesFormProps) {
  const [year, month, day] = today.split("-").map(Number);
  const {
    control,
    register,
    trigger,
    getValues,
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
  // A stable key so the effect only reruns when units or dates really change.
  const checkKey = JSON.stringify([unitIds, startDate, endDate]);

  // Conflict check, debounced. Nothing to check without units or a valid range.
  useEffect(() => {
    const [ids, start, end] = JSON.parse(checkKey) as [string[], string, string];
    const checkable = ids.length > 0 && isIsoDate(start) && isIsoDate(end) && end >= start;
    const timer = setTimeout(() => {
      if (!checkable) {
        onClearConflicts();
        return;
      }
      // Validation failures are already shown inline by the form.
      onCheckConflicts({ unitIds: ids, startDate: start, endDate: end, reason: getValues("reason") }).catch(() =>
        onClearConflicts(),
      );
    }, CONFLICT_CHECK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [checkKey, getValues, onCheckConflicts, onClearConflicts]);

  return (
    <form noValidate aria-label="Block dates" className="flex flex-col gap-5">
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
    </form>
  );
}
