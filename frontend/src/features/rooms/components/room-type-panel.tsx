"use client";

import { useCallback, useEffect, useRef } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { useToast } from "@/components/ui/toast";
import { toApiError } from "@/lib/api-client/errors";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { cn } from "@/lib/utils";
import { ROOM_TYPE_DESCRIPTION_MAX } from "../constants";
import type { RoomType, RoomTypeInput } from "../types";
import {
  roomTypeFormDefaults,
  roomTypeFormSchema,
  toRoomTypeInput,
  ROOM_TYPE_NAME_TAKEN,
  type RoomTypeFormValues,
} from "../validation";
import { Field, FIELD, PanelFooter, PanelHeader, PanelShell } from "./panel-shell";

const FORM_ID = "room-type-form";
const TITLE_ID = "room-type-panel-title";

type RoomTypePanelProps = {
  // The room type being edited; left out to add a new one.
  roomType?: RoomType;
  roomTypes: RoomType[];
  saving: boolean;
  onRequestClose: () => void;
  onDirtyChange: (dirty: boolean) => void;
  // Creates or updates; rejects with an ApiError.
  onSave: (input: RoomTypeInput) => Promise<RoomType>;
  // After a successful add, so the workspace can show the new room type.
  onCreated: (roomType: RoomType) => void;
  onRefresh: () => void;
};

// Add room type / Edit room type: name and an optional short description.
export function RoomTypePanel(props: RoomTypePanelProps) {
  return (
    <PanelShell titleId={TITLE_ID} focusKey={props.roomType?.id ?? "new"} onRequestClose={props.onRequestClose}>
      <RoomTypeForm key={props.roomType?.id ?? "new"} {...props} />
    </PanelShell>
  );
}

function RoomTypeForm(props: RoomTypePanelProps) {
  const { roomType, roomTypes, saving, onRequestClose, onDirtyChange, onSave, onCreated, onRefresh } = props;
  const toast = useToast();
  const editing = roomType !== undefined;

  // The other room types' names, read at validation time.
  const otherNames = useRef<string[]>([]);
  useEffect(() => {
    otherNames.current = roomTypes.filter((t) => t.id !== roomType?.id).map((t) => t.name);
  }, [roomTypes, roomType?.id]);
  const resolver = useCallback<Resolver<RoomTypeFormValues>>(
    (values, context, options) => zodResolver(roomTypeFormSchema(otherNames.current))(values, context, options),
    [],
  );

  const {
    control,
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm<RoomTypeFormValues>({ resolver, mode: "onChange", defaultValues: roomTypeFormDefaults(roomType) });

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const description = useWatch({ control, name: "description" }) ?? "";
  const canSubmit = isDirty && isValid && !saving;

  async function save(values: RoomTypeFormValues) {
    try {
      const saved = await onSave(toRoomTypeInput(values));
      if (editing) {
        toast("Room type updated");
        reset(roomTypeFormDefaults(saved));
      } else {
        toast("Room type added");
        onCreated(saved);
      }
    } catch (failure) {
      const error = toApiError(failure);
      if (error.fieldErrors.name) setError("name", { type: "server", message: error.fieldErrors.name }, { shouldFocus: true });
      if (error.fieldErrors.description) setError("description", { type: "server", message: error.fieldErrors.description });
      toast(editing ? "Could not save changes" : "Could not add room type", "error");
      if (error.fieldErrors.name === ROOM_TYPE_NAME_TAKEN) onRefresh();
    }
  }

  return (
    <>
      <PanelHeader titleId={TITLE_ID} title={editing ? "Edit room type" : "Add room type"} onClose={onRequestClose}>
        <div className="mt-3 border-b border-border" />
      </PanelHeader>

      <form
        id={FORM_ID}
        noValidate
        aria-labelledby={TITLE_ID}
        onSubmit={(event) => void handleSubmit(save)(event)}
        className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4"
      >
        <Field id="room-type-name" label="Room type name" help="Room type name must be unique within this property." error={errors.name?.message}>
          {(describedBy) => (
            <input
              id="room-type-name"
              type="text"
              autoComplete="off"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={describedBy}
              {...register("name")}
              className={cn(FIELD, errors.name ? "border-office-danger" : "border-border")}
            />
          )}
        </Field>

        <Field
          id="room-type-description"
          label="Description (optional)"
          error={errors.description?.message}
          aside={
            <span id="room-type-description-count" className="text-xs text-office-muted">
              {description.length}/{ROOM_TYPE_DESCRIPTION_MAX}
              <span className="sr-only"> characters</span>
            </span>
          }
        >
          {(describedBy) => (
            <textarea
              id="room-type-description"
              rows={3}
              maxLength={ROOM_TYPE_DESCRIPTION_MAX}
              aria-describedby={[describedBy, "room-type-description-count"].filter(Boolean).join(" ")}
              {...register("description")}
              className={cn(FIELD, "h-auto resize-none py-2.5 md:h-auto", errors.description ? "border-office-danger" : "border-border")}
            />
          )}
        </Field>
      </form>

      <PanelFooter formId={FORM_ID} submitLabel="Save" canSubmit={canSubmit} saving={saving} onCancel={onRequestClose} />
    </>
  );
}
