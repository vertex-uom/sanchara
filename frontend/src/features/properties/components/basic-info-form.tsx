"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { ChevronDown, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field";
import { FlatCard } from "@/components/ui/widget";
import { cn } from "@/lib/utils";
import { saveBasicInfoAction, type SettingsFormState } from "../actions";
import { BASIC_LIMITS, PROPERTY_CATEGORY_LABELS, PROPERTY_TYPE_LABELS } from "../config";
import type { PropertySettings } from "../types";
import type { BasicInfoInput } from "../validation";

const TYPE_OPTIONS = Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({ value, label }));
const CATEGORY_OPTIONS = [{ value: "", label: "Not set" }, ...Object.entries(PROPERTY_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))];
const STAR_OPTIONS = [
  { value: "", label: "Not rated" },
  ...[1, 2, 3, 4, 5].map((stars) => ({ value: String(stars), label: `${stars} Star${stars === 1 ? "" : "s"}` })),
];

const INITIAL: SettingsFormState = { error: null, saved: 0 };

function toInput(property: PropertySettings): BasicInfoInput {
  const { basic } = property;
  return {
    name: basic.name,
    type: basic.type,
    description: basic.description,
    starRating: basic.starRating ? String(basic.starRating) : "",
    establishedYear: basic.establishedYear ? String(basic.establishedYear) : "",
    category: basic.category ?? "",
  };
}

// Basic Information: the saved details first, and "Edit settings" opens the
// form with the Discard / Save bar under it. The form is display: contents so
// both sit in the page grid beside the logo and status cards (which are their
// own forms). Keyed by property id.
export function BasicInfoForm({ property }: { property: PropertySettings }) {
  const [state, formAction, pending] = useActionState(saveBasicInfoAction, INITIAL);
  const [version, setVersion] = useState(property.version);
  const [values, setValues] = useState(() => toInput(property));
  const [editing, setEditing] = useState(false);
  // The action state when editing started; older errors aren't shown again.
  const [editStart, setEditStart] = useState(state);
  const [seenSaves, setSeenSaves] = useState(0);
  const editButton = useRef<HTMLButtonElement>(null);
  const firstRender = useRef(true);

  // A save brings a new version: start from it.
  if (property.version !== version) {
    setVersion(property.version);
    setValues(toInput(property));
  }
  // A successful save goes back to the saved details.
  if (state.saved !== seenSaves) {
    setSeenSaves(state.saved);
    setEditing(false);
  }

  const saved = toInput(property);
  const dirty = editing && (Object.keys(values) as (keyof BasicInfoInput)[]).some((key) => values[key] !== saved[key]);
  const current = state !== editStart ? state : INITIAL;
  const errors = current.error?.fieldErrors ?? {};
  const formError = current.error && Object.keys(errors).length === 0 ? current.error.message : null;
  const set = (key: keyof BasicInfoInput) => (value: string) => setValues((previous) => ({ ...previous, [key]: value }));

  function startEditing() {
    setValues(toInput(property));
    setEditStart(state);
    setEditing(true);
  }

  function discard() {
    setValues(toInput(property));
    setEditing(false);
  }

  // Focus follows the switch: the first field when editing starts, the Edit button after.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (editing) document.getElementById("property-name")?.focus();
    else editButton.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (!editing) {
    return (
      <BasicInfoView property={property} editButton={editButton} onEdit={startEditing} justSaved={state.saved > 0 && !state.error} />
    );
  }

  return (
    <form action={formAction} noValidate className="contents">
      <input type="hidden" name="propertyId" value={property.id} />
      <input type="hidden" name="version" value={property.version} />

      <FlatCard aria-labelledby="basic-info-title" className="flex flex-col gap-5 xl:col-start-1 xl:row-start-1">
        <div>
          <h2 id="basic-info-title" className="text-lg font-semibold">
            Basic Information
          </h2>
          <p className="mt-0.5 text-sm text-office-muted">
            Manage your property&apos;s basic details. This information will be shown on your website and booking channels.
          </p>
        </div>
        {current.error ? (
          <p role="alert" className="rounded-lg border border-office-danger/40 bg-office-danger-soft px-3 py-2 text-sm font-medium text-office-danger-text">
            {formError ?? current.error.message}
          </p>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="property-name" label="Property name" required error={errors.name}>
            <input
              id="property-name"
              name="name"
              required
              autoComplete="organization"
              maxLength={BASIC_LIMITS.name}
              value={values.name}
              onChange={(event) => set("name")(event.target.value)}
              {...describedBy("property-name", errors.name)}
              className={cn(fieldClass, "px-4 aria-invalid:border-office-danger")}
            />
          </Field>
          <Field id="property-type" label="Property type" required error={errors.type}>
            <Select id="property-type" name="type" value={values.type} options={TYPE_OPTIONS} onChange={set("type")} error={errors.type} />
          </Field>

          <Field id="property-description" label="Short description" required error={errors.description} className="sm:col-span-2">
            <div className="relative">
              <textarea
                id="property-description"
                name="description"
                required
                rows={3}
                maxLength={BASIC_LIMITS.description}
                value={values.description}
                onChange={(event) => set("description")(event.target.value)}
                aria-invalid={errors.description ? true : undefined}
                aria-describedby={`property-description-count${errors.description ? " property-description-error" : ""}`}
                className="focus-ring block w-full resize-y rounded-md border border-border bg-card px-4 pt-3 pb-7 text-sm text-foreground aria-invalid:border-office-danger"
              />
              <span id="property-description-count" className="pointer-events-none absolute right-3 bottom-2 text-xs text-office-muted">
                {values.description.length}/{BASIC_LIMITS.description}
                <span className="sr-only"> characters used</span>
              </span>
            </div>
          </Field>

          <Field id="property-stars" label="Star rating" error={errors.starRating}>
            <Select id="property-stars" name="starRating" value={values.starRating} options={STAR_OPTIONS} onChange={set("starRating")} error={errors.starRating} />
          </Field>
          <Field id="property-year" label="Established year" error={errors.establishedYear}>
            <input
              id="property-year"
              name="establishedYear"
              inputMode="numeric"
              maxLength={4}
              placeholder="e.g. 2015"
              value={values.establishedYear}
              onChange={(event) => set("establishedYear")(event.target.value)}
              {...describedBy("property-year", errors.establishedYear)}
              className={cn(fieldClass, "px-4 placeholder:text-office-muted aria-invalid:border-office-danger")}
            />
          </Field>
          <Field id="property-category" label="Property category" error={errors.category}>
            <Select id="property-category" name="category" value={values.category} options={CATEGORY_OPTIONS} onChange={set("category")} error={errors.category} />
          </Field>
        </div>
      </FlatCard>

      <FlatCard aria-label="Save basic information" className="flex flex-wrap items-center justify-end gap-3 xl:col-span-2 xl:row-start-2">
        <p role="status" className="mr-auto text-sm text-office-muted">
          {dirty ? "You have unsaved changes." : ""}
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={discard}
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

type BasicInfoViewProps = {
  property: PropertySettings;
  editButton: RefObject<HTMLButtonElement | null>;
  onEdit: () => void;
  justSaved: boolean;
};

// The saved details, read-only. Optional fields that are empty say "Not set".
function BasicInfoView({ property, editButton, onEdit, justSaved }: BasicInfoViewProps) {
  const { basic } = property;
  const rows: { label: string; value: string | null; wide?: boolean }[] = [
    { label: "Property name", value: basic.name },
    { label: "Property type", value: PROPERTY_TYPE_LABELS[basic.type] },
    { label: "Short description", value: basic.description, wide: true },
    { label: "Star rating", value: basic.starRating ? `${basic.starRating} Star${basic.starRating === 1 ? "" : "s"}` : null },
    { label: "Established year", value: basic.establishedYear ? String(basic.establishedYear) : null },
    { label: "Property category", value: basic.category ? PROPERTY_CATEGORY_LABELS[basic.category] : null },
  ];

  return (
    <FlatCard aria-labelledby="basic-info-title" className="flex flex-col gap-5 xl:col-start-1 xl:row-start-1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 id="basic-info-title" className="text-lg font-semibold">
            Basic Information
          </h2>
          <p className="mt-0.5 text-sm text-office-muted">
            Your property&apos;s basic details, as shown on your website and booking channels.
          </p>
        </div>
        <Button ref={editButton} type="button" variant="office" onClick={onEdit} className="h-11 gap-2 rounded-lg px-4 text-base md:h-10">
          <Pencil aria-hidden="true" className="size-4" />
          Edit settings
        </Button>
      </div>
      <p role="status" className={justSaved ? "rounded-lg bg-office-success-soft px-3 py-2 text-sm font-medium text-office-success-text" : "sr-only"}>
        {justSaved ? "Changes saved." : ""}
      </p>
      <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className={row.wide ? "sm:col-span-2" : undefined}>
            <dt className="text-sm text-office-muted">{row.label}</dt>
            <dd className={cn("mt-1 text-sm", row.value ? "font-medium text-foreground" : "text-office-muted italic")}>
              {row.value ?? "Not set"}
            </dd>
          </div>
        ))}
      </dl>
    </FlatCard>
  );
}

function describedBy(id: string, error?: string) {
  return { "aria-invalid": error ? true : undefined, "aria-describedby": error ? `${id}-error` : undefined };
}

type FieldProps = { id: string; label: string; required?: boolean; error?: string; className?: string; children: ReactNode };

function Field({ id, label, required = false, error, className, children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
        {required ? (
          <span aria-hidden="true"> *</span>
        ) : (
          <span className="font-normal text-office-muted"> (optional)</span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-office-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type SelectProps = {
  id: string;
  name: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  error?: string;
};

function Select({ id, name, value, options, onChange, error }: SelectProps) {
  return (
    <div className="relative">
      <select
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...describedBy(id, error)}
        className={cn(fieldClass, "cursor-pointer appearance-none pr-10 pl-4 aria-invalid:border-office-danger")}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-office-icon" />
    </div>
  );
}
