"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlatCard } from "@/components/ui/widget";
import { saveSectionAction, type SettingsFormState } from "../actions";
import type { PropertySettings, SettingsSection } from "../types";
import type { FormValues } from "../validation";

const INITIAL: SettingsFormState = { error: null, saved: 0 };

export type SectionForm = {
  values: FormValues;
  set: (key: string) => (value: string) => void;
  errors: Record<string, string>;
};

type EditableSectionProps = {
  section: SettingsSection;
  property: Pick<PropertySettings, "id" | "version">;
  title: string;
  // Under the title while viewing, and while editing.
  viewDescription: string;
  editDescription: string;
  // The saved values as form text.
  initial: FormValues;
  // Focused when editing starts.
  firstFieldId: string;
  view: ReactNode;
  fields: (form: SectionForm) => ReactNode;
  // Checks run on every change (e.g. phone numbers): an error shows while
  // typing in a changed field, and Save waits until there are none.
  check?: (values: FormValues) => Record<string, string | undefined>;
  editLabel?: string;
  // Grid placement on the Basic Information tab.
  cardClassName?: string;
  barClassName?: string;
};

// One settings tab: the saved details first; "Edit settings" opens the form
// with the Discard / Save bar under it. Save goes back to the details.
// The form is display: contents so the card and bar sit in the page layout.
export function EditableSection({
  section,
  property,
  title,
  viewDescription,
  editDescription,
  initial,
  firstFieldId,
  view,
  fields,
  check,
  editLabel = "Edit settings",
  cardClassName,
  barClassName,
}: EditableSectionProps) {
  const [state, formAction, pending] = useActionState(saveSectionAction, INITIAL);
  const [version, setVersion] = useState(property.version);
  const [values, setValues] = useState(initial);
  const [editing, setEditing] = useState(false);
  // The action state when editing started; older errors aren't shown again.
  const [editStart, setEditStart] = useState(state);
  const [seenSaves, setSeenSaves] = useState(0);
  // A blocked save shows the live errors of unchanged fields too.
  const [checkAll, setCheckAll] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null);
  const firstRender = useRef(true);
  const titleId = `${section}-settings-title`;

  // A save brings a new version: start from it.
  if (property.version !== version) {
    setVersion(property.version);
    setValues(initial);
  }
  // A successful save goes back to the saved details.
  if (state.saved !== seenSaves) {
    setSeenSaves(state.saved);
    setEditing(false);
  }

  const dirty = editing && Object.keys({ ...initial, ...values }).some((key) => (values[key] ?? "") !== (initial[key] ?? ""));
  const current = state !== editStart ? state : INITIAL;
  const errors = { ...current.error?.fieldErrors };
  const liveErrors = check?.(values) ?? {};
  // A changed field shows its live check, which replaces the server's answer.
  for (const [key, message] of Object.entries(liveErrors)) {
    if (!checkAll && (values[key] ?? "") === (initial[key] ?? "")) continue;
    if (message) errors[key] = message;
    else delete errors[key];
  }
  const set = (key: string) => (value: string) => setValues((previous) => ({ ...previous, [key]: value }));

  // Focus follows the switch: the first field when editing starts, the Edit button after.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (editing) document.getElementById(firstFieldId)?.focus();
    else editButton.current?.focus();
  }, [editing, firstFieldId]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const heading = (description: string) => (
    <div className="min-w-0 flex-1">
      <h2 id={titleId} className="text-lg font-semibold">
        {title}
      </h2>
      <p className="mt-0.5 text-sm text-office-muted">{description}</p>
    </div>
  );

  if (!editing) {
    const justSaved = state.saved > 0 && !state.error;
    return (
      <FlatCard aria-labelledby={titleId} className={`flex flex-col gap-5 ${cardClassName ?? ""}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          {heading(viewDescription)}
          <Button
            ref={editButton}
            type="button"
            variant="office"
            onClick={() => {
              setValues(initial);
              setEditStart(state);
              setCheckAll(false);
              setEditing(true);
            }}
            className="h-11 gap-2 rounded-lg px-4 text-base md:h-10"
          >
            <Pencil aria-hidden="true" className="size-4" />
            {editLabel}
          </Button>
        </div>
        <p role="status" className={justSaved ? "rounded-lg bg-office-success-soft px-3 py-2 text-sm font-medium text-office-success-text" : "sr-only"}>
          {justSaved ? "Changes saved." : ""}
        </p>
        {view}
      </FlatCard>
    );
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const invalid = Object.keys(liveErrors).find((key) => liveErrors[key]);
    if (!invalid) return;
    event.preventDefault();
    setCheckAll(true);
    event.currentTarget.querySelector<HTMLElement>(`[name="${invalid}"]`)?.focus();
  }

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="contents">
      <input type="hidden" name="propertyId" value={property.id} />
      <input type="hidden" name="version" value={property.version} />
      <input type="hidden" name="section" value={section} />

      <FlatCard aria-labelledby={titleId} className={`flex flex-col gap-5 ${cardClassName ?? ""}`}>
        {heading(editDescription)}
        {current.error ? (
          <p role="alert" className="rounded-lg border border-office-danger/40 bg-office-danger-soft px-3 py-2 text-sm font-medium text-office-danger-text">
            {current.error.message}
          </p>
        ) : null}
        {fields({ values, set, errors })}
      </FlatCard>

      <FlatCard aria-label={`Save ${title.toLowerCase()}`} className={`flex flex-wrap items-center justify-end gap-3 ${barClassName ?? ""}`}>
        <p role="status" className="mr-auto text-sm text-office-muted">
          {dirty ? "You have unsaved changes." : ""}
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => {
            setValues(initial);
            setEditing(false);
          }}
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
