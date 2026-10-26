"use client";

import { useForm } from "react-hook-form";
import type { PropertyUnits } from "../types";
import { blockFormSchema, zodResolver, type BlockFormValues } from "../validation";
import { SelectUnits } from "./select-units";

const RESOLVER = zodResolver(blockFormSchema);

type BlockDatesFormProps = {
  // Null while loading.
  propertyUnits: PropertyUnits | null;
  // Shown instead of the unit list when it couldn't load.
  unitsError?: string;
};

// The Block dates steps. Form state lives in react-hook-form; nothing is
// selected at first.
export function BlockDatesForm({ propertyUnits, unitsError }: BlockDatesFormProps) {
  const { control } = useForm<BlockFormValues>({ resolver: RESOLVER, defaultValues: { unitIds: [] } });

  return (
    <form noValidate aria-label="Block dates" className="flex flex-col gap-5">
      {unitsError ? (
        <p role="alert" className="text-sm font-medium text-office-danger-text">
          {unitsError}
        </p>
      ) : (
        <SelectUnits control={control} propertyUnits={propertyUnits} />
      )}
    </form>
  );
}
