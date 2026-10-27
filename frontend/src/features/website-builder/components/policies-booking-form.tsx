"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Clock, Phone, Zap } from "lucide-react";
import { cn } from "cn";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { ChoiceCards, type ChoiceOption } from "./choice-cards";
import { DRAFT_KEYS, useTemplateDraft } from "./template-draft";
import {
  Field,
  formCardClass,
  inputClass,
  SelectInput,
  ToggleRow,
} from "./template-fields";
import { TemplateProgress } from "./template-progress";

const FORM_PATH = `${COMPANY_PATHS.website}/template-form`;

type Cancellation = "flexible" | "moderate" | "strict";

export const CANCELLATION: ChoiceOption<Cancellation>[] = [
  {
    value: "flexible",
    label: "Flexible",
    description: "Free cancellation up to 24 hours before check-in.",
  },
  {
    value: "moderate",
    label: "Moderate",
    description: "Free cancellation up to 5 days before check-in.",
  },
  {
    value: "strict",
    label: "Strict",
    description: "50% refund up to 7 days before check-in.",
  },
];

const MIN_STAYS = [
  "1 night",
  "2 nights",
  "3 nights",
  "4 nights",
  "5 nights",
  "7 nights",
  "14 nights",
];
const BOOK_AHEAD = [
  "3 months in advance",
  "6 months in advance",
  "12 months in advance",
  "18 months in advance",
  "24 months in advance",
];
const HOUSE_RULES_MAX = 500;

export type PoliciesBooking = {
  checkIn: string;
  checkOut: string;
  minStay: string;
  bookAhead: string;
  alertEmail: string;
  cancellation: Cancellation;
  children: boolean;
  pets: boolean;
  smoking: boolean;
  houseRules: string;
};

// Step 5 of the hotel template form.
export function PoliciesBookingForm() {
  const router = useRouter();
  const { values, update, save, saved } = useTemplateDraft<PoliciesBooking>(
    DRAFT_KEYS.policies,
    {
      checkIn: "14:00",
      checkOut: "11:00",
      minStay: MIN_STAYS[0],
      bookAhead: "12 months in advance",
      alertEmail: "",
      cancellation: "flexible",
      children: true,
      pets: false,
      smoking: false,
      houseRules: "",
    },
  );
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save();
    router.push(`${FORM_PATH}/contact`);
  }

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <form
        id="policies-booking-form"
        onSubmit={handleSubmit}
        className="flex min-w-0 flex-1 flex-col gap-5"
      >
        <section aria-labelledby="check-in-title" className={formCardClass}>
          <h2
            id="check-in-title"
            className="text-lg font-semibold text-office-icon"
          >
            Check-in &amp; check-out
          </h2>
          <p className="mt-1 text-sm text-office-muted">
            Shown on room pages and in booking confirmations.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field id="check-in" label="Check-in from" required>
              <TimeInput
                id="check-in"
                value={values.checkIn}
                onChange={(checkIn) => update({ checkIn })}
              />
            </Field>
            <Field id="check-out" label="Check-out until" required>
              <TimeInput
                id="check-out"
                value={values.checkOut}
                onChange={(checkOut) => update({ checkOut })}
              />
            </Field>
            <Field id="min-stay" label="Minimum stay" required>
              <SelectInput
                id="min-stay"
                required
                options={MIN_STAYS}
                value={values.minStay}
                onChange={(event) => update({ minStay: event.target.value })}
              />
            </Field>
            <Field id="book-ahead" label="Book up to">
              <SelectInput
                id="book-ahead"
                options={BOOK_AHEAD}
                value={values.bookAhead}
                onChange={(event) => update({ bookAhead: event.target.value })}
              />
            </Field>
          </div>
        </section>

        <section aria-labelledby="booking-title" className={formCardClass}>
          <h2
            id="booking-title"
            className="text-lg font-semibold text-office-icon"
          >
            How guests book
          </h2>
          <p className="mt-1 text-sm text-office-muted">
            Bookings from your website are instant and paid in full by card.
          </p>
          {/* Every booking is instant and paid in full by card on the WEMIXT
              checkout, so there is nothing to choose here. */}
          <div className="mt-5 flex items-center gap-4 rounded-xl border-[1.5px] border-brand-cyan bg-[#f8fcfd] px-4 py-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-office-tint-teal text-office-primary">
              <Zap aria-hidden="true" className="size-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-office-icon">
                Instant booking
              </span>
              <span className="block text-xs text-office-muted">
                &quot;Book now&quot; takes guests to the secure WEMIXT checkout,
                where they pay the full amount by credit or debit card. Rooms
                are confirmed straight away.
              </span>
            </span>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field id="alert-email" label="Send booking alerts to" required>
              <input
                id="alert-email"
                type="email"
                required
                autoComplete="email"
                value={values.alertEmail}
                onChange={(event) => update({ alertEmail: event.target.value })}
                placeholder="bookings@palmbreeze.lk"
                className={inputClass}
              />
            </Field>
          </div>
        </section>

        <section aria-labelledby="rules-title" className={formCardClass}>
          <h2
            id="rules-title"
            className="text-lg font-semibold text-office-icon"
          >
            Cancellation &amp; house rules
          </h2>
          <p className="mt-1 text-sm text-office-muted">
            Guests must accept these before booking.
          </p>
          <div className="mt-5">
            <ChoiceCards
              name="cancellation"
              legend="Cancellation policy"
              required
              options={CANCELLATION}
              value={values.cancellation}
              onChange={(cancellation) => update({ cancellation })}
            />
          </div>
          {/* Guests can't cancel online; the property handles every
              cancellation, so there is nothing to choose here. */}
          <div className="mt-5 flex items-center gap-4 rounded-xl border-[1.5px] border-brand-cyan bg-[#f8fcfd] px-4 py-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-office-tint-teal text-office-primary">
              <Phone aria-hidden="true" className="size-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-office-icon">
                Cancel by contacting the property
              </span>
              <span className="block text-xs text-office-muted">
                Guests cannot cancel online. To cancel, they contact you
                directly by phone or email, and you apply the policy above.
              </span>
            </span>
          </div>
          <div className="mt-5 flex flex-col gap-4">
            <ToggleRow
              id="children-allowed"
              label="Children allowed"
              description="Children of all ages are welcome."
              checked={values.children}
              onChange={(children) => update({ children })}
            />
            <ToggleRow
              id="pets-allowed"
              label="Pets allowed"
              description="Guests can bring pets on request."
              checked={values.pets}
              onChange={(pets) => update({ pets })}
            />
            <ToggleRow
              id="smoking-allowed"
              label="Smoking allowed"
              description="Smoking in rooms and indoor areas."
              checked={values.smoking}
              onChange={(smoking) => update({ smoking })}
            />
          </div>
          <Field
            id="house-rules"
            label="Other house rules"
            hint={`Optional · ${values.houseRules.length} / ${HOUSE_RULES_MAX}`}
            className="mt-5"
          >
            <textarea
              id="house-rules"
              rows={3}
              maxLength={HOUSE_RULES_MAX}
              value={values.houseRules}
              onChange={(event) => update({ houseRules: event.target.value })}
              placeholder="Quiet hours from 10:00 PM to 7:00 AM. Please do not bring outside guests into the rooms after 9:00 PM."
              className={cn(inputClass, "h-auto resize-y py-3 leading-relaxed")}
            />
          </Field>
        </section>
      </form>

      <TemplateProgress
        formStep={5}
        note="Check-in times and policies appear on the booking page and in every confirmation email."
        formId="policies-booking-form"
        backHref={`${FORM_PATH}/facilities`}
        onSaveDraft={save}
        saved={saved}
      />
    </div>
  );
}

// Native time picker (shown as "2:00 PM" in a 12-hour locale) with the design's clock icon.
function TimeInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type="time"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          inputClass,
          "pr-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:size-5 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
        )}
      />
      <Clock
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-office-icon"
      />
    </div>
  );
}
