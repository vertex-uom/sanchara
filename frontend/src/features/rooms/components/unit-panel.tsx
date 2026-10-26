"use client";

import { useCallback, useEffect, useRef } from "react";
import { useForm, useWatch, type Resolver, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import { ChevronDown, ChevronUp, Info, TriangleAlert } from "lucide-react";
import { RemoteImage } from "@/components/ui/remote-image";
import { useToast } from "@/components/ui/toast";
import { toApiError } from "@/lib/api-client/errors";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { cn } from "@/lib/utils";
import { INACTIVE_UNIT_WITH_RESERVATIONS, MAX_GUESTS_MAX, MAX_GUESTS_MIN } from "../constants";
import { DEACTIVATION_WARNING } from "../status-tokens";
import type { RoomType, RoomUnit, UpdateUnitInput } from "../types";
import {
  deactivationRule,
  newUnitDefaults,
  toUpdateUnitInput,
  unitFormDefaults,
  unitFormSchema,
  UNIT_NAME_TAKEN,
  type UnitFormValues,
} from "../validation";
import { Field, FIELD, LABEL, PanelFooter, PanelHeader, PanelShell } from "./panel-shell";
import { UnitStatusBadge } from "./unit-status-badge";

const PLACEHOLDER_PHOTO = "/images/room-placeholder.jpg";
const FORM_ID = "unit-form";
const TITLE_ID = "unit-panel-title";

type UnitPanelProps = {
  // The unit being edited; left out to add a new one.
  unit?: RoomUnit;
  // Room type a new unit starts with.
  defaultRoomTypeId: string;
  // Every unit of the property, for the unique-name check.
  units: RoomUnit[];
  roomTypes: RoomType[];
  saving: boolean;
  // Asks to close; the workspace confirms first when there are unsaved changes.
  onRequestClose: () => void;
  onDirtyChange: (dirty: boolean) => void;
  // Creates or updates; rejects with an ApiError.
  onSave: (input: UpdateUnitInput) => Promise<RoomUnit>;
  // After a successful add, so the workspace can select the new card.
  onCreated: (unit: RoomUnit) => void;
  // Re-reads the units quietly (after a save lost a race).
  onRefresh: () => void;
};

// Add unit / Edit unit panel: (edit only) a summary, then name, room type,
// maximum guests and status, with a pinned Cancel / submit footer.
export function UnitPanel(props: UnitPanelProps) {
  return (
    <PanelShell titleId={TITLE_ID} focusKey={props.unit?.id ?? "new"} onRequestClose={props.onRequestClose}>
      <UnitForm key={props.unit?.id ?? "new"} {...props} />
    </PanelShell>
  );
}

// Remounted per unit (key) so the form starts from that unit's saved values.
function UnitForm(props: UnitPanelProps) {
  const { unit, defaultRoomTypeId, units, roomTypes, saving, onRequestClose, onDirtyChange, onSave, onCreated, onRefresh } = props;
  const toast = useToast();
  const editing = unit !== undefined;

  // The other units' names, read at validation time so new units count too.
  const otherNames = useRef<string[]>([]);
  useEffect(() => {
    otherNames.current = units.filter((u) => u.id !== unit?.id).map((u) => u.name);
  }, [units, unit?.id]);
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
  } = useForm<UnitFormValues>({
    resolver,
    mode: "onChange",
    defaultValues: unit ? unitFormDefaults(unit) : newUnitDefaults(defaultRoomTypeId),
  });

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const status = useWatch({ control, name: "status" });
  const rule = unit ? deactivationRule(unit, status) : { warn: false, blocksSave: false };
  const canSubmit = isDirty && isValid && !rule.blocksSave && !saving;

  async function save(values: UnitFormValues) {
    try {
      const saved = await onSave(toUpdateUnitInput(values));
      if (editing) {
        toast("Unit updated");
        reset(unitFormDefaults(saved));
      } else {
        toast("Unit added");
        onCreated(saved);
      }
    } catch (failure) {
      const error = toApiError(failure);
      if (error.fieldErrors.name) setError("name", { type: "server", message: error.fieldErrors.name }, { shouldFocus: true });
      if (error.fieldErrors.maxGuests) setError("maxGuests", { type: "server", message: error.fieldErrors.maxGuests });
      if (error.fieldErrors.roomTypeId) setError("roomTypeId", { type: "server", message: error.fieldErrors.roomTypeId });
      toast(editing ? "Could not save changes" : "Could not add unit", "error");
      // Someone else changed the units (e.g. took this name): show the latest.
      if (error.fieldErrors.name === UNIT_NAME_TAKEN || error.status === 409) onRefresh();
    }
  }

  const roomTypeName = roomTypes.find((t) => t.id === unit?.roomTypeId)?.name ?? "";

  return (
    <>
      <PanelHeader titleId={TITLE_ID} title={editing ? "Edit unit" : "Add unit"} onClose={onRequestClose}>
        {unit ? (
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
        ) : (
          <div className="mt-3 border-b border-border" />
        )}
      </PanelHeader>

      <form
        id={FORM_ID}
        noValidate
        aria-labelledby={TITLE_ID}
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
        ) : unit?.hasFutureReservations ? (
          <p className="flex gap-2 rounded-[12px] bg-office-tint-blue p-3 text-sm text-office-label">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-office-ink-blue" />
            A unit with future reservations can&apos;t be deactivated.
          </p>
        ) : null}
      </form>

      <PanelFooter
        formId={FORM_ID}
        submitLabel={editing ? "Save changes" : "Add unit"}
        canSubmit={canSubmit}
        saving={saving}
        onCancel={onRequestClose}
      />
    </>
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

  // Side by side and 44px wide on phones; stacked halves from md.
  const arrow = "focus-ring flex h-full w-11 items-center justify-center text-office-icon hover:bg-office-chip md:h-1/2 md:w-9";

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
          "[appearance:textfield] pr-24 md:pr-11 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          invalid ? "border-office-danger" : "border-border",
        )}
      />
      {/* Full field height so the arrows are 44px tall on phones. */}
      <div className="absolute inset-y-0 right-0 flex overflow-hidden rounded-r-lg border-l border-border md:flex-col">
        <button type="button" tabIndex={-1} aria-label="Increase maximum guests" onClick={() => step(1)} className={arrow}>
          <ChevronUp aria-hidden="true" className="size-3.5" />
        </button>
        <button type="button" tabIndex={-1} aria-label="Decrease maximum guests" onClick={() => step(-1)} className={cn(arrow, "border-l border-border md:border-t md:border-l-0")}>
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
