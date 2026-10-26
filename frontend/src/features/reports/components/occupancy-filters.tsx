import Form from "next/form";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChipLink } from "@/components/ui/chip-link";
import { fieldClass, NativeSelect } from "@/components/ui/field";
import { FlatCard } from "@/components/ui/widget";
import { ALL_ROOM_TYPES } from "../config";
import { REPORT_RANGES, reportHref, type ReportFilters } from "../report-filters";
import type { RoomTypeOption } from "../types";

type OccupancyFiltersProps = { path: string; filters: ReportFilters; roomTypes: RoomTypeOption[] };

const labelClass = "mb-2 block text-sm text-office-label";

// Preset chips are links; dates and room type are a GET form, so filters work without JS.
export function OccupancyFilters({ path, filters, roomTypes }: OccupancyFiltersProps) {
  const roomType = roomTypes.some((type) => type.id === filters.roomType) ? filters.roomType : ALL_ROOM_TYPES;

  return (
    <FlatCard aria-label="Report filters" className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:gap-x-8 print:hidden">
      <div role="group" aria-labelledby="report-range-label">
        <p id="report-range-label" className={labelClass}>
          Date range
        </p>
        <ul className="flex flex-wrap gap-2">
          {REPORT_RANGES.map(({ value, label }) => (
            <li key={value}>
              <ChipLink
                // "Custom" moves focus to the From date instead of changing the URL.
                href={value === "custom" ? "#report-from" : reportHref(path, filters, { range: value })}
                active={value === filters.range}
                size="sm"
              >
                {label}
              </ChipLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Keyed so the fields show the new values after a chip changes the range. */}
      <Form
        key={`${filters.from}:${filters.to}:${roomType}`}
        action={path}
        scroll={false}
        className="grid flex-1 grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-4"
      >
        <DateField id="report-from" name="from" label="From" value={filters.from} />
        <DateField id="report-to" name="to" label="To" value={filters.to} />
        <NativeSelect
          id="report-room-type"
          name="roomType"
          label="Room type"
          defaultValue={roomType}
          options={[
            { value: ALL_ROOM_TYPES, label: "All room types" },
            ...roomTypes.map((type) => ({ value: type.id, label: type.name })),
          ]}
          className="col-span-2 sm:ml-auto sm:w-48"
        />
        <Button type="submit" variant="office" className="col-span-2 h-11 rounded-md px-4 md:h-10">
          Apply
        </Button>
      </Form>
    </FlatCard>
  );
}

function DateField({ id, name, label, value }: { id: string; name: string; label: string; value: string }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <Calendar
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-office-icon"
        />
        <input
          id={id}
          name={name}
          type="date"
          required
          defaultValue={value}
          className={cn(fieldClass, "pr-2 pl-10 sm:w-44")}
        />
      </div>
    </div>
  );
}
