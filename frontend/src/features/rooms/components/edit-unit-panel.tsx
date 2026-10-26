"use client";

import { useCallback, useEffect, useRef, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { useForm, useWatch, type Resolver, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import { Dialog } from "radix-ui";
import { ChevronDown, ChevronUp, Info, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RemoteImage } from "@/components/ui/remote-image";
import { useToast } from "@/components/ui/toast";
import { toApiError } from "@/lib/api-client/errors";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { INACTIVE_UNIT_WITH_RESERVATIONS, MAX_GUESTS_MAX, MAX_GUESTS_MIN } from "../constants";
import { DEACTIVATION_WARNING } from "../status-tokens";
import type { RoomType, RoomUnit, UpdateUnitInput } from "../types";
import {
  deactivationRule,
  toUpdateUnitInput,
  unitFormDefaults,
  unitFormSchema,
  UNIT_NAME_TAKEN,
  type UnitFormValues,
} from "../validation";
import { UnitStatusBadge } from "./unit-status-badge";

const PLACEHOLDER_PHOTO = "/images/room-placeholder.jpg";
// From this width the panel docks beside the rooms; below it, it's a drawer
// (tablet) or a full-screen sheet (phone).
const DESKTOP_QUERY = "(min-width: 80rem)";
const FORM_ID = "edit-unit-form";

const FIELD = "focus-ring h-11 w-full rounded-lg border bg-card px-3 text-sm text-foreground md:h-10";
const LABEL = "mb-1.5 block text-sm font-medium text-office-label";
const HELP = "mt-1.5 text-xs text-office-muted";
const ERROR = "mt-1.5 text-xs font-medium text-office-danger-text";

type EditUnitPanelProps = {
  unit: RoomUnit;
  // Every unit of the property, for the unique-name check.
  units: RoomUnit[];
  roomTypes: RoomType[];
  saving: boolean;
  // Asks to close; the workspace confirms first when there are unsaved changes.
  onRequestClose: () => void;
  onDirtyChange: (dirty: boolean) => void;
  // Rejects with an ApiError.
  onSave: (input: UpdateUnitInput) => Promise<RoomUnit>;
  // Re-reads the units quietly (after a save lost a race).
  onRefresh: () => void;
};

// Right-hand Edit unit panel: summary, the four fields, and a pinned
// Cancel / Save footer. Docked on desktop, modal below that.
export function EditUnitPanel(props: EditUnitPanelProps) {
  const { unit, onRequestClose } = props;
  const docked = useMediaQuery(DESKTOP_QUERY, true);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Docked: move focus to the title whenever a different unit is opened.
  useEffect(() => {
    if (docked) headingRef.current?.focus();
  }, [docked, unit.id]);

  // Decided here once and passed down, so the body never renders the modal title outside the modal.
  const body = <PanelBody key={unit.id} {...props} headingRef={headingRef} docked={docked} />;

  if (docked) {
    return (
      <aside
        aria-labelledby="edit-unit-title"
        onKeyDown={(event: KeyboardEvent) => {
          if (event.key === "Escape") onRequestClose();
        }}
        className="flex flex-col overflow-hidden rounded-[16px] border border-border bg-card xl:sticky xl:top-22 xl:h-[calc(100dvh-7rem)]"
      >
        {body}
      </aside>
    );
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onRequestClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            headingRef.current?.focus();
          }}
          className={cn(
            "fixed inset-0 z-50 flex flex-col bg-card shadow-xl",
            "md:left-auto md:w-[22rem] md:max-w-[90vw] md:border-l md:border-border",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom md:data-[state=open]:slide-in-from-right motion-reduce:animate-none",
          )}
        >
          {body}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type PanelBodyProps = EditUnitPanelProps & { headingRef: RefObject<HTMLHeadingElement | null>; docked: boolean };

// Remounted per unit (key) so the form starts from that unit's saved values.
function PanelBody(props: PanelBodyProps) {
  const { unit, units, roomTypes, saving, onRequestClose, onDirtyChange, onSave, onRefresh, headingRef, docked } = props;
  const toast = useToast();
  const roomTypeName = roomTypes.find((t) => t.id === unit.roomTypeId)?.name ?? "";

  // The other units' names, read at validation time so new units count too.
  const otherNames = useRef<string[]>([]);
  useEffect(() => {
    otherNames.current = units.filter((u) => u.id !== unit.id).map((u) => u.name);
  }, [units, unit.id]);
  const resolver = useCallback<Resolver<UnitFormValues>>(
    (values, context, options) => zodResolver(unitFormSchema(otherNames.current))(values, context, options),
    [],
  );

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm<UnitFormValues>({ resolver, mode: "onChange", defaultValues: unitFormDefaults(unit) });

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const status = useWatch({ control, name: "status" });
  const rule = deactivationRule(unit, status);
  const canSave = isDirty && isValid && !rule.blocksSave && !saving;

  async function save(values: UnitFormValues) {
    try {
      const updated = await onSave(toUpdateUnitInput(values));
      toast("Unit updated");
      reset(unitFormDefaults(updated));
    } catch (failure) {
      const error = toApiError(failure);
      if (error.fieldErrors.name) setError("name", { type: "server", message: error.fieldErrors.name }, { shouldFocus: true });
      if (error.fieldErrors.maxGuests) setError("maxGuests", { type: "server", message: error.fieldErrors.maxGuests });
      if (error.fieldErrors.roomTypeId) setError("roomTypeId", { type: "server", message: error.fieldErrors.roomTypeId });
      toast("Could not save changes", "error");
      // Someone else changed the units (e.g. took this name): show the latest.
      if (error.fieldErrors.name === UNIT_NAME_TAKEN || error.status === 409) onRefresh();
    }
  }

  const title = (
    <h2 id="edit-unit-title" ref={headingRef} tabIndex={-1} className="text-lg font-bold text-foreground outline-none">
      Edit unit
    </h2>
  );

  return (
    <>
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between gap-2">
          {docked ? title : <Dialog.Title asChild>{title}</Dialog.Title>}
          <button
            type="button"
            onClick={onRequestClose}
            aria-label="Close edit unit"
            className="focus-ring inline-flex size-11 items-center justify-center rounded-md text-office-icon hover:bg-office-chip md:size-8"
          >
            <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3 border-b border-border pb-4">
          <RemoteImage
            src={unit.photoUrl ?? PLACEHOLDER_PHOTO}
            alt=""
            width={128}
            height={128}
            className="size-14 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-bold text-foreground">{unit.name}</p>
              <UnitStatusBadge isActive={unit.isActive} />
            </div>
            <p className="text-xs text-office-muted">
              {roomTypeName}
              <span aria-hidden="true" className="mx-1">
                •
              </span>
              <span className="sr-only">, </span>
              Max {unit.maxGuests} {unit.maxGuests === 1 ? "guest" : "guests"}
            </p>
          </div>
        </div>
      </div>

      <form
        id={FORM_ID}
        noValidate
        aria-labelledby="edit-unit-title"
        onSubmit={(event) => void handleSubmit(save)(event)}
        className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4"
      >
        <Field id="unit-name" label="Unit name" help="Unit name must be unique within this property." error={errors.name?.message}>
          {(describedBy) => (
            <input
              id="unit-name"
              type="text"
              autoComplete="off"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={describedBy}
              {...register("name")}
              className={cn(FIELD, errors.name ? "border-office-danger" : "border-border")}
            />
          )}
        </Field>

        <Field id="unit-room-type" label="Room type" error={errors.roomTypeId?.message}>
          {(describedBy) => (
            <div className="relative">
              <select
                id="unit-room-type"
                aria-describedby={describedBy}
                {...register("roomTypeId")}
                className={cn(FIELD, "cursor-pointer appearance-none pr-10", errors.roomTypeId ? "border-office-danger" : "border-border")}
              >
                {roomTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-office-icon" />
            </div>
          )}
        </Field>

        <Field
          id="unit-max-guests"
          label="Maximum guests"
          help="Maximum number of guests allowed for this unit."
          error={errors.maxGuests?.message}
        >
          {(describedBy) => (
            <GuestStepper describedBy={describedBy} invalid={Boolean(errors.maxGuests)} register={register} setValue={setValue} getValues={getValues} />
          )}
        </Field>

        <fieldset>
          <legend className={LABEL}>Status</legend>
          <div className="grid grid-cols-2 gap-2">
            <StatusCard register={register} value="active" label="Active" caption="Available for booking" />
            <StatusCard register={register} value="inactive" label="Inactive" caption="Not available for booking" />
          </div>
        </fieldset>

        {rule.warn ? (
          <p role="alert" className={cn("flex gap-2 rounded-[12px] p-3 text-sm", DEACTIVATION_WARNING.box)}>
            <TriangleAlert aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", DEACTIVATION_WARNING.icon)} />
            {/* "prevent" blocks saving; "warn_and_allow" lets it through, so the wording differs. */}
            {INACTIVE_UNIT_WITH_RESERVATIONS === "prevent"
              ? "This unit has future reservations, so it can't be deactivated."
              : "This unit has future reservations. They stay booked if you deactivate it."}
          </p>
        ) : unit.hasFutureReservations ? (
          <p className="flex gap-2 rounded-[12px] bg-office-tint-blue p-3 text-sm text-office-label">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-office-ink-blue" />
            A unit with future reservations can&apos;t be deactivated.
          </p>
        ) : null}
      </form>

      <div className="grid grid-cols-2 gap-3 border-t border-border p-4">
        <Button type="button" variant="outline" onClick={onRequestClose} className="h-11 rounded-lg bg-card text-sm font-semibold">
          Cancel
        </Button>
        <Button
          type="submit"
          form={FORM_ID}
          disabled={!canSave}
          aria-busy={saving || undefined}
          className={cn(
            "h-11 gap-2 rounded-lg text-sm font-semibold",
            canSave || saving
              ? "bg-brand-tropical text-white hover:bg-brand-tropical/90"
              : "bg-office-chip text-office-muted disabled:opacity-100",
          )}
        >
          {saving ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : null}
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </>
  );
}

type FieldProps = {
  id: string;
  label: string;
  help?: string;
  error?: string;
  // Renders the control; receives the ids to put in aria-describedby.
  children: (describedBy: string | undefined) => ReactNode;
};

function Field({ id, label, help, error, children }: FieldProps) {
  const ids = [help ? `${id}-help` : null, error ? `${id}-error` : null].filter(Boolean).join(" ");
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      {children(ids || undefined)}
      {help ? (
        <p id={`${id}-help`} className={HELP}>
          {help}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className={ERROR}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

type GuestStepperProps = {
  describedBy?: string;
  invalid: boolean;
  register: UseFormRegister<UnitFormValues>;
  setValue: UseFormSetValue<UnitFormValues>;
  getValues: () => UnitFormValues;
};

// Number input with up/down arrows on the right. Arrow keys work too.
function GuestStepper({ describedBy, invalid, register, setValue, getValues }: GuestStepperProps) {
  function step(by: number) {
    const current = Number.isFinite(getValues().maxGuests) ? getValues().maxGuests : MAX_GUESTS_MIN;
    const next = Math.min(MAX_GUESTS_MAX, Math.max(MAX_GUESTS_MIN, current + by));
    setValue("maxGuests", next, { shouldDirty: true, shouldValidate: true });
  }

  const arrow = "focus-ring flex h-1/2 w-9 items-center justify-center text-office-icon hover:bg-office-chip";

  return (
    <div className="relative">
      <input
        id="unit-max-guests"
        type="number"
        inputMode="numeric"
        min={MAX_GUESTS_MIN}
        max={MAX_GUESTS_MAX}
        step={1}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        {...register("maxGuests", { valueAsNumber: true })}
        className={cn(
          FIELD,
          "[appearance:textfield] pr-11 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          invalid ? "border-office-danger" : "border-border",
        )}
      />
      <div className="absolute inset-y-px right-px flex flex-col overflow-hidden rounded-r-lg border-l border-border">
        <button type="button" tabIndex={-1} aria-label="Increase maximum guests" onClick={() => step(1)} className={arrow}>
          <ChevronUp aria-hidden="true" className="size-3.5" />
        </button>
        <button type="button" tabIndex={-1} aria-label="Decrease maximum guests" onClick={() => step(-1)} className={cn(arrow, "border-t border-border")}>
          <ChevronDown aria-hidden="true" className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

type StatusCardProps = {
  register: UseFormRegister<UnitFormValues>;
  value: UnitFormValues["status"];
  label: string;
  caption: string;
};

// Radio drawn as a card: teal border, light teal fill and a filled dot when chosen.
function StatusCard({ register, value, label, caption }: StatusCardProps) {
  return (
    <label className="group flex cursor-pointer items-start gap-2 rounded-[12px] border border-border bg-card p-3 transition-colors has-checked:border-brand-teal has-checked:bg-brand-aqua/60 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--focus-ring) motion-reduce:transition-none">
      <input type="radio" value={value} {...register("status")} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 border-office-muted group-has-checked:border-brand-tropical"
      >
        <span className="size-2 rounded-full bg-brand-tropical opacity-0 group-has-checked:opacity-100" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="block text-xs text-office-muted">{caption}</span>
      </span>
    </label>
  );
}
