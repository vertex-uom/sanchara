"use client";

import { useActionState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogActions } from "@/components/ui/dialog-actions";
import { NativeSelect } from "@/components/ui/field";
import { createPackageAction, type NewPackageState } from "../actions";
import { PACKAGE_LIMITS, PACKAGE_THEMES, THEME_LABELS } from "../config";

const inputClass =
  "focus-ring h-11 w-full rounded-md border border-border bg-card px-4 text-sm text-foreground placeholder:text-office-muted aria-invalid:border-office-danger md:h-10";

const THEME_OPTIONS = PACKAGE_THEMES.map((theme) => ({ value: theme, label: THEME_LABELS[theme] }));

const INITIAL: NewPackageState = { error: null, values: { name: "", theme: "general", nights: "2" } };

// Client only for field errors: the Server Action validates and returns them.
export function NewPackageForm({ propertyId, closeHref }: { propertyId: string; closeHref: string }) {
  const [state, formAction, pending] = useActionState(createPackageAction, INITIAL);
  const fieldErrors = state.error?.fieldErrors ?? {};
  const formError = state.error && Object.keys(fieldErrors).length === 0 ? state.error.message : null;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="propertyId" value={propertyId} />
      {formError ? (
        <p role="alert" className="text-sm font-medium text-office-danger">
          {formError}
        </p>
      ) : null}
      <div>
        <label htmlFor="new-package-name" className="mb-2 block text-sm font-medium">
          Package name
        </label>
        <input
          id="new-package-name"
          name="name"
          required
          maxLength={PACKAGE_LIMITS.name}
          placeholder="e.g. 3-Night Surf Camp"
          defaultValue={state.values.name}
          aria-invalid={fieldErrors.name ? true : undefined}
          aria-describedby={fieldErrors.name ? "new-package-name-error" : undefined}
          className={inputClass}
        />
        {fieldErrors.name ? (
          <p id="new-package-name-error" className="mt-1.5 text-sm text-office-danger">
            {fieldErrors.name}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <NativeSelect id="new-package-theme" name="theme" label="Theme" defaultValue={state.values.theme} options={THEME_OPTIONS} />
        <div>
          <label htmlFor="new-package-nights" className="mb-2 block text-sm text-office-label">
            Nights
          </label>
          <input
            id="new-package-nights"
            name="nights"
            inputMode="numeric"
            required
            defaultValue={state.values.nights}
            aria-invalid={fieldErrors.nights ? true : undefined}
            aria-describedby={fieldErrors.nights ? "new-package-nights-error" : undefined}
            className={inputClass}
          />
          {fieldErrors.nights ? (
            <p id="new-package-nights-error" className="mt-1.5 text-sm text-office-danger">
              {fieldErrors.nights}
            </p>
          ) : null}
        </div>
      </div>
      {fieldErrors.theme ? <p className="text-sm text-office-danger">{fieldErrors.theme}</p> : null}
      <p className="flex gap-2 text-sm text-office-muted">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-office-icon" />
        The package starts as a draft. Add its itinerary, then set it to Active.
      </p>
      <DialogActions closeHref={closeHref}>
        <Button type="submit" variant="office" disabled={pending} className="h-11 rounded-lg text-base md:h-10">
          {pending ? "Creating…" : "Create package"}
        </Button>
      </DialogActions>
    </form>
  );
}
