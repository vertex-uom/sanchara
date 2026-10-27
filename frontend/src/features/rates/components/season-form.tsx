"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { DialogActions, dialogButtonClass } from "@/components/ui/dialog-actions";
import { saveSeasonAction, type DialogFormState } from "../actions";
import { RATE_LIMITS } from "../config";
import type { Season } from "../types";
import type { SeasonInput } from "../validation";
import { DialogField, dialogInputClass } from "./dialog-field";

type SeasonFormProps = { propertyId: string; season: Season | null; closeHref: string };

// Add (season null) or edit a season. Client only for field errors.
export function SeasonForm({ propertyId, season, closeHref }: SeasonFormProps) {
  const initial: DialogFormState<SeasonInput> = {
    error: null,
    values: { name: season?.name ?? "", from: season?.from ?? "", to: season?.to ?? "" },
  };
  const [state, formAction, pending] = useActionState(saveSeasonAction, initial);
  const errors = state.error?.fieldErrors ?? {};
  const formError = state.error && Object.keys(errors).length === 0 ? state.error.message : null;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="propertyId" value={propertyId} />
      <input type="hidden" name="seasonId" value={season?.id ?? ""} />
      {formError ? (
        <p role="alert" className="text-sm font-medium text-office-danger">
          {formError}
        </p>
      ) : null}
      <DialogField id="season-name" label="Season name" error={errors.name}>
        <input
          id="season-name"
          name="name"
          required
          maxLength={RATE_LIMITS.seasonName}
          placeholder="e.g. Peak season"
          defaultValue={state.values.name}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "season-name-error" : undefined}
          className={dialogInputClass}
        />
      </DialogField>
      <div className="grid grid-cols-2 gap-4">
        <DialogField id="season-from" label="Starts" error={errors.from}>
          <input
            id="season-from"
            name="from"
            type="date"
            required
            defaultValue={state.values.from}
            aria-invalid={errors.from ? true : undefined}
            aria-describedby={errors.from ? "season-from-error" : undefined}
            className={dialogInputClass}
          />
        </DialogField>
        <DialogField id="season-to" label="Ends" error={errors.to}>
          <input
            id="season-to"
            name="to"
            type="date"
            required
            defaultValue={state.values.to}
            aria-invalid={errors.to ? true : undefined}
            aria-describedby={errors.to ? "season-to-error" : undefined}
            className={dialogInputClass}
          />
        </DialogField>
      </div>
      <p className="text-sm text-office-muted">Both dates are included. Seasons can&apos;t overlap.</p>
      <DialogActions closeHref={closeHref}>
        <Button type="submit" variant="office" disabled={pending} className={dialogButtonClass}>
          {pending ? "Saving…" : season ? "Save season" : "Add season"}
        </Button>
      </DialogActions>
    </form>
  );
}
