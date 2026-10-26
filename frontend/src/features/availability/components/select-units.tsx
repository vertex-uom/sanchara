"use client";

import { useController, type Control } from "react-hook-form";
import { Skeleton } from "@/components/ui/widget";
import type { PropertyUnits } from "../types";
import type { BlockFormValues } from "../validation";
import { Checkbox } from "./checkbox";
import { StepHeading } from "./step-heading";

type SelectUnitsProps = {
  control: Control<BlockFormValues>;
  // Null while loading.
  propertyUnits: PropertyUnits | null;
};

// "All", "some" or "none" of these ids are in the selection.
function selectionState(ids: string[], selected: Set<string>) {
  const count = ids.filter((id) => selected.has(id)).length;
  return { checked: ids.length > 0 && count === ids.length, indeterminate: count > 0 && count < ids.length };
}

// Step 1 of Block dates: units grouped by room type, with Select all per
// group and Select whole property.
export function SelectUnits({ control, propertyUnits }: SelectUnitsProps) {
  const { field, fieldState } = useController({ control, name: "unitIds" });
  const selected = new Set(field.value);
  const allIds = propertyUnits?.units.map((u) => u.id) ?? [];

  // Keeps the selection in the property's unit order.
  function update(next: Set<string>) {
    field.onChange(allIds.filter((id) => next.has(id)));
  }

  function setMany(ids: string[], checked: boolean) {
    const next = new Set(selected);
    for (const id of ids) {
      if (checked) next.add(id);
      else next.delete(id);
    }
    update(next);
  }

  const whole = selectionState(allIds, selected);
  const errorId = "block-units-error";

  return (
    <section aria-labelledby="block-step-units" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <StepHeading step={1} id="block-step-units">
          Select units
        </StepHeading>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-office-label">
          <Checkbox
            checked={whole.checked}
            indeterminate={whole.indeterminate}
            disabled={!propertyUnits}
            onChange={(event) => setMany(allIds, event.target.checked)}
          />
          Select whole property
        </label>
      </div>

      {propertyUnits ? (
        propertyUnits.roomTypes.map((roomType) => {
          const units = propertyUnits.units.filter((u) => u.roomTypeId === roomType.id);
          if (units.length === 0) return null;
          const ids = units.map((u) => u.id);
          const group = selectionState(ids, selected);
          const groupLabelId = `block-group-${roomType.id}`;

          return (
            <div
              key={roomType.id}
              role="group"
              aria-labelledby={groupLabelId}
              aria-describedby={fieldState.error ? errorId : undefined}
              className="rounded-lg border border-border p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span id={groupLabelId} className="text-xs font-bold text-foreground">
                  {roomType.name} Rooms
                </span>
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-office-label">
                  Select all
                  <span className="sr-only"> {roomType.name} Rooms</span>
                  <Checkbox
                    checked={group.checked}
                    indeterminate={group.indeterminate}
                    onChange={(event) => setMany(ids, event.target.checked)}
                  />
                </label>
              </div>
              <ul className="mt-2 flex flex-col">
                {units.map((unit) => (
                  <li key={unit.id}>
                    <label className="flex h-9 cursor-pointer items-center gap-2 text-xs text-foreground md:h-7">
                      <Checkbox
                        name="unitIds"
                        value={unit.id}
                        checked={selected.has(unit.id)}
                        onChange={(event) => setMany([unit.id], event.target.checked)}
                      />
                      <span className="flex-1">{unit.name}</span>
                      <span className="text-office-muted">
                        Max {unit.maxGuests} {unit.maxGuests === 1 ? "guest" : "guests"}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      ) : (
        <div aria-busy="true" className="flex flex-col gap-3">
          <span className="sr-only">Loading units</span>
          <Skeleton className="h-36 rounded-lg" />
          <Skeleton className="h-36 rounded-lg" />
        </div>
      )}

      {fieldState.error ? (
        <p id={errorId} className="text-xs font-medium text-office-danger-text">
          {fieldState.error.message}
        </p>
      ) : null}
    </section>
  );
}
