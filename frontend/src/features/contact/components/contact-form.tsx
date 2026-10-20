"use client";

import { useActionState, useEffect, useRef, useState, type FocusEvent, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, CircleCheck, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { sendContactMessage } from "../actions";
import { HONEYPOT_FIELD } from "../config";
import { initialContactState } from "../form-state";
import { CONTACT_SUBJECTS, MESSAGE_MAX, contactSchema, fieldErrorsFrom, type FieldErrors } from "../schema";

const controlClass =
  "focus-ring w-full rounded-2xl border border-brand-lagoon bg-white px-4 text-sm text-brand-tropical transition-colors placeholder:text-muted-foreground motion-reduce:transition-none";
const invalidClass = "border-destructive";

// "Send us a message". Remounting (new key) starts a fresh form after a send.
export function ContactForm() {
  const [formKey, setFormKey] = useState(0);
  return <ContactFormInner key={formKey} onReset={() => setFormKey((key) => key + 1)} />;
}

function ContactFormInner({ onReset }: { onReset: () => void }) {
  const [state, action, pending] = useActionState(sendContactMessage, initialContactState);
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [focusRequest, setFocusRequest] = useState(0);
  const [messageLength, setMessageLength] = useState(state.values?.message?.length ?? 0);

  // A new server answer replaces client errors and asks for focus.
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    setClientErrors({});
    setFocusRequest((count) => count + 1);
  }

  useEffect(() => {
    if (focusRequest === 0) return;
    if (state.sent) {
      successRef.current?.focus();
      return;
    }
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-form-message]')?.focus();
  }, [focusRequest, state.sent]);

  function errorsFor(form: HTMLFormElement): FieldErrors {
    const result = contactSchema.safeParse(Object.fromEntries(new FormData(form)));
    return result.success ? {} : fieldErrorsFrom(result.error);
  }

  // Invalid submits never reach the server.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const errors = errorsFor(event.currentTarget);
    if (Object.keys(errors).length === 0) return;
    event.preventDefault();
    setClientErrors(errors);
    setFocusRequest((count) => count + 1);
  }

  // Only the field that lost focus updates, so untouched fields stay quiet.
  function handleBlur(event: FocusEvent<HTMLFormElement>) {
    const field = event.target;
    if (!("name" in field) || typeof field.name !== "string" || !field.name || field.name === HONEYPOT_FIELD) return;
    const name = field.name;
    const message = errorsFor(event.currentTarget)[name];
    setClientErrors((current) => ({ ...current, [name]: message }));
  }

  if (state.sent) {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className="flex flex-col items-center py-10 text-center outline-none">
        <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-brand-aqua text-brand-teal">
          <CircleCheck className="size-8" />
        </span>
        <p className="mt-5 text-2xl font-semibold text-brand-tropical">Thank you! Your message has been sent.</p>
        <p className="mt-2 text-muted-foreground">We&apos;ll get back to you shortly.</p>
        <button
          type="button"
          onClick={onReset}
          className="focus-ring mt-6 inline-flex min-h-11 items-center rounded-full border border-brand-tropical px-5 text-sm font-medium text-brand-tropical transition-colors hover:bg-brand-aqua motion-reduce:transition-none"
        >
          Send another message
        </button>
      </div>
    );
  }

  const errors: FieldErrors = { ...state.fieldErrors };
  // Client results win: a fixed field clears its server error too.
  for (const [name, message] of Object.entries(clientErrors)) {
    if (message === undefined) delete errors[name];
    else errors[name] = message;
  }
  const values = state.values ?? {};

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit} onBlur={handleBlur} noValidate className="space-y-4">
      {state.message ? (
        <p data-form-message="" tabIndex={-1} role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive outline-none">
          {state.message}
        </p>
      ) : null}

      {/* Honeypot: hidden from people and assistive tech. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="contact-website">Leave this empty</label>
        <input id="contact-website" name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="contact-name" label="Name" error={errors.name}>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            defaultValue={values.name}
            required
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            className={cn(controlClass, "h-12", errors.name && invalidClass)}
          />
        </Field>
        <Field id="contact-email" label="Email" error={errors.email}>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Your email address"
            defaultValue={values.email}
            required
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            className={cn(controlClass, "h-12", errors.email && invalidClass)}
          />
        </Field>
      </div>

      <Field id="contact-subject" label="Subject" error={errors.subject}>
        <div className="relative">
          <select
            id="contact-subject"
            name="subject"
            defaultValue={values.subject || CONTACT_SUBJECTS[0]}
            aria-invalid={errors.subject ? true : undefined}
            aria-describedby={errors.subject ? "contact-subject-error" : undefined}
            className={cn(controlClass, "h-12 cursor-pointer appearance-none pr-10", errors.subject && invalidClass)}
          >
            {CONTACT_SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-brand-tropical" />
        </div>
      </Field>

      <Field
        id="contact-message"
        label="Message"
        error={errors.message}
        aside={
          <span id="contact-message-count" className="text-xs text-muted-foreground">
            {messageLength}/{MESSAGE_MAX}
          </span>
        }
      >
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          maxLength={MESSAGE_MAX}
          placeholder="How can we help you?"
          defaultValue={values.message}
          onChange={(event) => setMessageLength(event.target.value.length)}
          required
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={cn(errors.message && "contact-message-error", "contact-message-count")}
          className={cn(controlClass, "resize-y py-3", errors.message && invalidClass)}
        />
      </Field>

      <p className="text-xs text-muted-foreground">
        Your details will only be used to respond to your inquiry and will never be shared with third parties. See our{" "}
        <Link href="/privacy" className="focus-ring rounded-sm font-medium text-brand-tropical underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </p>

      <button
        type="submit"
        disabled={pending}
        aria-disabled={pending}
        className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-linear-to-r from-brand-tropical via-brand-tropical to-brand-teal px-8 text-sm font-medium text-white shadow-md transition-opacity disabled:cursor-wait disabled:opacity-80 motion-reduce:transition-none sm:w-auto"
      >
        {pending ? "Sending…" : "Send Message"}
        <Send aria-hidden="true" className="size-4" />
      </button>
    </form>
  );
}

type FieldProps = { id: string; label: string; error?: string; aside?: ReactNode; children: ReactNode };

function Field({ id, label, error, aside, children }: FieldProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-brand-tropical">
          {label}
        </label>
        {aside}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 pl-1 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
