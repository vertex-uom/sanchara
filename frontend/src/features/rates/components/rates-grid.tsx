"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { BedDouble, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlatCard } from "@/components/ui/widget";
import { cn } from "@/lib/utils";
import { saveRatesAction, type RatesFormState } from "../actions";
import { seasonRange } from "../season-label";
import type { RateGrid, Residency, RoomTypeOption, Season } from "../types";

const INITIAL: RatesFormState = { error: null, saved: 0 };

type RatesGridProps = {
  propertyId: string;
  planId: string;
  planName: string;
  residency: Residency;
  currency: string;
  version: number;
  year: string;
  roomTypes: RoomTypeOption[];
  seasons: Season[];
  grid: RateGrid;
  // The residency and plan chips, shown at the top of the card.
  toolbar: ReactNode;
};

const cellKey = (roomTypeId: string, column: string) => `rate:${roomTypeId}:${column}`;

// Minor units → what the field shows ("18000", "60.50").
function toText(amountMinor: number | undefined, currency: string) {
  if (amountMinor === undefined) return "";
  const major = amountMinor / 100;
  return currency === "LKR" ? String(Math.round(major)) : String(Number(major.toFixed(2)));
}

function toValues(grid: RateGrid, roomTypes: RoomTypeOption[], columns: string[], currency: string) {
  return Object.fromEntries(
    roomTypes.flatMap((roomType) => columns.map((column) => [cellKey(roomType.id, column), toText(grid[roomType.id]?.[column]?.amountMinor, currency)])),
  );
}

// The rates table for one plan and residency, edited in place with the
// Discard / Save card under it. Season cells left empty use the base rate.
// The page keys it by plan and residency.
export function RatesGrid({ propertyId, planId, planName, residency, currency, version, year, roomTypes, seasons, grid, toolbar }: RatesGridProps) {
  const columns = ["base", ...seasons.map((season) => season.id)];
  const initial = toValues(grid, roomTypes, columns, currency);
  const [state, formAction, pending] = useActionState(saveRatesAction, INITIAL);
  const [savedVersion, setSavedVersion] = useState(version);
  const [values, setValues] = useState(initial);

  // A save (here or elsewhere) brings a new version: start from it.
  if (version !== savedVersion) {
    setSavedVersion(version);
    setValues(initial);
  }

  const dirty = Object.keys(initial).some((key) => (values[key] ?? "") !== initial[key]);
  const errors = state.error?.fieldErrors ?? {};

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <form action={formAction} noValidate className="contents">
      <input type="hidden" name="propertyId" value={propertyId} />
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="residency" value={residency} />
      <input type="hidden" name="version" value={version} />

      <FlatCard aria-label="Rates" className="flex flex-col gap-5">
      {toolbar}
      {state.error ? (
        <p role="alert" className="rounded-lg border border-office-danger/40 bg-office-danger-soft px-3 py-2 text-sm font-medium text-office-danger-text">
          {state.error.message}
        </p>
      ) : null}

      <section aria-labelledby="rates-table-title" className="flex flex-col gap-4">
        <h2 id="rates-table-title" className="text-lg font-semibold">
          Seasons ({year})
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[44rem] border-collapse">
            <caption className="sr-only">
              {planName} rates in {currency} per unit per night. Season cells left empty use the base rate.
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-4 py-3 text-left text-sm font-semibold">
                  Room type
                </th>
                <ColumnHeading title="Base rate" subtitle="All year" />
                {seasons.map((season) => (
                  <ColumnHeading key={season.id} title={season.name} subtitle={seasonRange(season.from, season.to)} />
                ))}
              </tr>
            </thead>
            <tbody>
              {roomTypes.map((roomType) => (
                <tr key={roomType.id} className="border-b border-border last:border-b-0">
                  <th scope="row" className="px-4 py-3 text-left">
                    <span className="flex items-center gap-3">
                      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-office-tint-teal">
                        <BedDouble className="size-4.5 text-office-primary" />
                      </span>
                      <span className="text-sm font-semibold">{roomType.name}</span>
                    </span>
                  </th>
                  {columns.map((column) => {
                    const key = cellKey(roomType.id, column);
                    const season = seasons.find((item) => item.id === column);
                    return (
                      <td key={column} className="border-l border-border px-3 py-3 align-top">
                        <RateInput
                          id={key.replaceAll(":", "-")}
                          name={key}
                          label={`${roomType.name}, ${season ? season.name : "base rate"}`}
                          currency={currency}
                          required={column === "base"}
                          value={values[key] ?? ""}
                          error={errors[key]}
                          onChange={(value) => setValues((previous) => ({ ...previous, [key]: value }))}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="flex items-start gap-2 text-sm text-office-muted">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-office-icon" />
          Prices are per unit per night, before taxes. Leave a season empty (–) to use the base rate.
        </p>
      </section>
      </FlatCard>

      <FlatCard aria-label="Save rates" className="flex flex-wrap items-center justify-end gap-3">
        <p role="status" className="mr-auto text-sm text-office-muted">
          {dirty ? "You have unsaved changes." : state.saved > 0 && !state.error ? "Rates saved." : ""}
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={!dirty || pending}
          onClick={() => setValues(initial)}
          className="h-11 rounded-lg bg-card px-5 text-base md:h-10"
        >
          Discard
        </Button>
        <Button type="submit" variant="office" disabled={!dirty || pending} className="h-11 rounded-lg px-5 text-base md:h-10">
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </FlatCard>
    </form>
  );
}

function ColumnHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <th scope="col" className="border-l border-border px-3 py-3 text-center">
      <span className="block text-sm font-semibold">{title}</span>
      <span className="block text-xs font-normal text-office-muted">{subtitle}</span>
    </th>
  );
}

type RateInputProps = {
  id: string;
  name: string;
  label: string;
  currency: string;
  required: boolean;
  value: string;
  error?: string;
  onChange: (value: string) => void;
};

// Currency shown inside the field; an empty season cell reads "–".
function RateInput({ id, name, label, currency, required, value, error, onChange }: RateInputProps) {
  const empty = !value && !required;
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label} in {currency}
        {required ? "" : " (empty uses the base rate)"}
      </label>
      <div
        className={cn(
          "flex h-11 items-center gap-1.5 rounded-lg border px-3 focus-within:border-office-primary focus-within:ring-2 focus-within:ring-office-primary/20 md:h-10",
          error ? "border-office-danger" : "border-border",
          empty ? "bg-office-chip" : "bg-card",
        )}
      >
        <span aria-hidden="true" className={cn("text-sm", empty ? "text-transparent" : "text-office-label")}>
          {currency}
        </span>
        <input
          id={id}
          name={name}
          inputMode={currency === "LKR" ? "numeric" : "decimal"}
          autoComplete="off"
          placeholder={required ? "0" : "–"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn("w-full min-w-0 bg-transparent text-sm outline-none", empty && "text-center placeholder:text-office-muted")}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-office-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
