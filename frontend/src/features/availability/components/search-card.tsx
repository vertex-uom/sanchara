"use client";

import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { ChevronDown, LoaderCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AvailabilitySearchParams, RoomType } from "../types";
import { MAX_GUESTS, searchSchema, zodResolver, type SearchValues } from "../validation";
import { DateField } from "./date-field";

const GUEST_OPTIONS = Array.from({ length: MAX_GUESTS }, (_, i) => i + 1);

type SearchCardProps = {
  roomTypes: RoomType[];
  defaultValues: AvailabilitySearchParams;
  // Colombo date ("YYYY-MM-DD"); arrival can't be earlier.
  today: string;
  searching: boolean;
  // Message from a failed search, shown under the fields.
  serverError?: string;
  onSearch: (params: AvailabilitySearchParams) => void;
};

// One-row search: dates, guests, room type, Search.
export function SearchCard({ roomTypes, defaultValues, today, searching, serverError, onSearch }: SearchCardProps) {
  const resolver = useMemo(() => zodResolver(searchSchema(today)), [today]);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchValues>({ resolver, defaultValues });

  const arrival = useWatch({ control, name: "arrival" });
  const roomTypeOptions = [{ id: "all", name: "All" }, ...roomTypes];

  return (
    <form
      noValidate
      aria-label="Check availability"
      onSubmit={handleSubmit((values) => onSearch(values))}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="flex flex-wrap items-start gap-3">
        <Controller
          control={control}
          name="arrival"
          render={({ field }) => (
            <DateField
              id="search-arrival"
              label="Arrival date"
              value={field.value}
              onChange={field.onChange}
              today={today}
              minDate={today}
              error={errors.arrival?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="departure"
          render={({ field }) => (
            <DateField
              id="search-departure"
              label="Departure date"
              value={field.value}
              onChange={field.onChange}
              today={today}
              minDate={arrival > today ? arrival : today}
              error={errors.departure?.message}
            />
          )}
        />

        <div className="flex flex-col">
          <label htmlFor="search-guests" className="mb-1.5 text-xs font-medium text-office-label">
            Number of guests
          </label>
          <div className="relative">
            <User aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-office-icon" />
            <select
              id="search-guests"
              aria-invalid={errors.guests ? true : undefined}
              aria-describedby={errors.guests ? "search-guests-error" : undefined}
              {...register("guests", { valueAsNumber: true })}
              className={cn(
                "focus-ring h-11 w-24 cursor-pointer appearance-none rounded-lg border bg-card pr-9 pl-9 text-sm text-foreground md:h-10",
                errors.guests ? "border-office-danger" : "border-border",
              )}
            >
              {GUEST_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-office-icon" />
          </div>
          {errors.guests ? (
            <p id="search-guests-error" className="mt-1 text-xs font-medium text-office-danger-text">
              {errors.guests.message}
            </p>
          ) : null}
        </div>

        <fieldset className="flex flex-col">
          <legend className="mb-1.5 text-xs font-medium text-office-label">Room type</legend>
          <div className="flex h-11 items-center gap-1 rounded-lg border border-border bg-card p-1 md:h-10">
            {roomTypeOptions.map((type) => (
              <label key={type.id} className="relative">
                <input type="radio" value={type.id} {...register("roomTypeId")} className="peer sr-only" />
                <span
                  className={cn(
                    "flex h-9 cursor-pointer items-center rounded-md px-3 text-sm font-medium text-foreground transition-colors motion-reduce:transition-none md:h-8",
                    "peer-checked:bg-brand-tropical peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--focus-ring)",
                    "hover:bg-office-chip peer-checked:hover:bg-brand-tropical",
                  )}
                >
                  {type.name}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Spacer the height of a label keeps the button level with the fields. */}
        <div className="ml-auto flex flex-col">
          <span aria-hidden="true" className="invisible mb-1.5 text-xs">
            Search
          </span>
          <Button
            type="submit"
            aria-busy={searching || undefined}
            disabled={searching}
            className="h-11 gap-2 rounded-lg bg-brand-tropical px-6 text-sm font-semibold text-white hover:bg-brand-tropical/90 md:h-10"
          >
            {searching ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : null}
            Search
          </Button>
        </div>
      </div>

      {serverError ? (
        <p role="alert" className="mt-3 text-sm font-medium text-office-danger-text">
          {serverError}
        </p>
      ) : null}
    </form>
  );
}
