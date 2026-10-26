"use client";

import { useForm } from "react-hook-form";
import { isoDate } from "@/lib/format/dates";
import type { PropertyUnits } from "../types";
import { blockFormSchema, zodResolver, type BlockFormValues } from "../validation";
import { SelectDates } from "./select-dates";
import { SelectReason } from "./select-reason";
import { SelectUnits } from "./select-units";

const RESOLVER = zodResolver(blockFormSchema);

// The block starts on the opening day and runs this many more days.
const DEFAULT_BLOCK_EXTRA_DAYS = 2;

type BlockDatesFormProps = {
  // Null while loading.
  propertyUnits: PropertyUnits | null;
  // Shown instead of the unit list when it couldn't load.
  unitsError?: string;
  // Colombo date ("YYYY-MM-DD").
  today: string;
};

// The Block dates steps. Form state lives in react-hook-form; no units are
// selected at first.
export function BlockDatesForm({ propertyUnits, unitsError, today }: BlockDatesFormProps) {
  const [year, month, day] = today.split("-").map(Number);
  const {
    control,
    register,
    trigger,
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
    </form>
  );
}
