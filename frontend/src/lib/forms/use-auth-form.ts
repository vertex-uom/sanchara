"use client";

import { useEffect, useRef, useState, type FocusEvent, type FormEvent } from "react";
import type { z } from "zod";
import { fieldErrorsFrom, type FieldErrors } from "./field-errors";

// The Server Action answer the hook reads (guest and staff auth forms).
type ActionFormState = { fieldErrors?: FieldErrors };

// Client-side checks with the same Zod schema the Server Action uses:
// a field is checked when it loses focus, the whole form on submit. Invalid
// submits never reach the server. After any error, focus moves to the first
// invalid field (or the form message).
export function useAuthForm(schema: z.ZodType, state: ActionFormState) {
  const formRef = useRef<HTMLFormElement>(null);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [focusRequest, setFocusRequest] = useState(0);

  // A new server answer replaces client errors and asks for focus.
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    setClientErrors({});
    setFocusRequest((count) => count + 1);
  }

  useEffect(() => {
    if (focusRequest === 0) return;
    const target = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-form-message]');
    target?.focus();
  }, [focusRequest]);

  function errorsFor(form: HTMLFormElement): FieldErrors {
    const result = schema.safeParse(Object.fromEntries(new FormData(form)));
    return result.success ? {} : fieldErrorsFrom(result.error);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const errors = errorsFor(event.currentTarget);
    if (Object.keys(errors).length === 0) return;
    event.preventDefault();
    setClientErrors(errors);
    setFocusRequest((count) => count + 1);
  }

  // Only the field that lost focus updates, so untouched fields stay quiet.
  function onBlur(event: FocusEvent<HTMLFormElement>) {
    const field: EventTarget = event.target;
    if (!(field instanceof HTMLInputElement) || !field.name || field.type === "checkbox") return;
    const name = field.name;
    const message = errorsFor(event.currentTarget)[name];
    setClientErrors((current) => ({ ...current, [name]: message }));
  }

  const errors: FieldErrors = { ...state.fieldErrors, ...stripEmpty(clientErrors) };
  // A field fixed on the client clears its server error too.
  for (const [name, message] of Object.entries(clientErrors)) if (message === undefined) delete errors[name];

  return { formRef, errors, onSubmit, onBlur };
}

function stripEmpty(errors: FieldErrors): FieldErrors {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message !== undefined));
}
