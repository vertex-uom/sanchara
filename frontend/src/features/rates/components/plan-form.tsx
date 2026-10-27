"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { DialogActions, dialogButtonClass } from "@/components/ui/dialog-actions";
import { NativeSelect } from "@/components/ui/field";
import { createPlanAction, type DialogFormState } from "../actions";
import { RATE_LIMITS } from "../config";
import type { RatePlan } from "../types";
import type { PlanInput } from "../validation";
import { DialogField, dialogInputClass } from "./dialog-field";

type PlanFormProps = { propertyId: string; plans: RatePlan[]; closeHref: string };

// New rate plan; it can start with a copy of another plan's rates.
export function PlanForm({ propertyId, plans, closeHref }: PlanFormProps) {
  const initial: DialogFormState<PlanInput> = { error: null, values: { name: "", description: "", copyFrom: plans[0]?.id ?? "" } };
  const [state, formAction, pending] = useActionState(createPlanAction, initial);
  const errors = state.error?.fieldErrors ?? {};
  const formError = state.error && Object.keys(errors).length === 0 ? state.error.message : null;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="propertyId" value={propertyId} />
      {formError ? (
        <p role="alert" className="text-sm font-medium text-office-danger">
          {formError}
        </p>
      ) : null}
      <DialogField id="plan-name" label="Rate plan name" error={errors.name}>
        <input
          id="plan-name"
          name="name"
          required
          maxLength={RATE_LIMITS.planName}
          placeholder="e.g. Long stay (7+ nights)"
          defaultValue={state.values.name}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "plan-name-error" : undefined}
          className={dialogInputClass}
        />
      </DialogField>
      <DialogField id="plan-description" label="Description (optional)" error={errors.description}>
        <input
          id="plan-description"
          name="description"
          maxLength={RATE_LIMITS.planDescription}
          placeholder="What's included"
          defaultValue={state.values.description}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? "plan-description-error" : undefined}
          className={dialogInputClass}
        />
      </DialogField>
      <NativeSelect
        id="plan-copy"
        name="copyFrom"
        label="Start with rates from"
        defaultValue={state.values.copyFrom}
        options={[...plans.map((plan) => ({ value: plan.id, label: plan.name })), { value: "", label: "No rates (fill in later)" }]}
      />
      <DialogActions closeHref={closeHref}>
        <Button type="submit" variant="office" disabled={pending} className={dialogButtonClass}>
          {pending ? "Adding…" : "Add rate plan"}
        </Button>
      </DialogActions>
    </form>
  );
}
