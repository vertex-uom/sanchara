"use client";

import { useController, type Control, type UseFormTrigger } from "react-hook-form";
import type { BlockFormValues } from "../validation";
import { DateField } from "./date-field";
import { StepHeading } from "./step-heading";

type SelectDatesProps = {
  control: Control<BlockFormValues>;
  trigger: UseFormTrigger<BlockFormValues>;
  // Colombo date ("YYYY-MM-DD"); earlier days can't be blocked.
  today: string;
};

// Step 2 of Block dates: start and end date, both inclusive.
export function SelectDates({ control, trigger, today }: SelectDatesProps) {
  const start = useController({ control, name: "startDate" });
  const end = useController({ control, name: "endDate" });
  const startValue = start.field.value;

  // Re-check the pair whenever either date changes, so the error shows inline.
  function change(onChange: (value: string) => void) {
    return (value: string) => {
      onChange(value);
      void trigger("endDate");
    };
  }

  return (
    <section aria-labelledby="block-step-dates" className="flex flex-col gap-3">
      <StepHeading step={2} id="block-step-dates">
        Select dates
      </StepHeading>
      <div className="grid grid-cols-2 gap-2">
        <DateField
          id="block-start"
          label="Start date"
          value={startValue}
          onChange={change(start.field.onChange)}
          today={today}
          minDate={today}
          error={start.fieldState.error?.message}
        />
        <DateField
          id="block-end"
          label="End date"
          value={end.field.value}
          onChange={change(end.field.onChange)}
          today={today}
          minDate={startValue > today ? startValue : today}
          error={end.fieldState.error?.message}
        />
      </div>
    </section>
  );
}
