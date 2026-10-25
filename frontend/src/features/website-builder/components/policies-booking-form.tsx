"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Clock,
  MessageSquare,
  CalendarCheck,
  Zap,
} from "lucide-react";
import { cn } from "cn";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { AmenityGrid } from "./amenity-grid";
import { ChoiceCards, type ChoiceOption } from "./choice-cards";
import { useTemplateDraft } from "./template-draft";
import {
  Field,
  formCardClass,
  inputClass,
  SelectInput,
  ToggleRow,
} from "./template-fields";
import { TemplateProgress } from "./template-progress";

const FORM_PATH = `${COMPANY_PATHS.website}/template-form`;

type BookingMode = "instant" | "request" | "contact";
type Cancellation = "flexible" | "moderate" | "strict";

const BOOKING_MODES: ChoiceOption<BookingMode>[] = [
  {
    value: "instant",
    label: "Instant booking",
    description:
      "Guests book and pay online. Rooms are confirmed straight away.",
    icon: Zap,
    badge: "Recommended",
  },
  {
    value: "request",
    label: "Booking request",
    description: "Guests send a request and you confirm it within 24 hours.",
    icon: CalendarCheck,
  },
  {
    value: "contact",
    label: "Contact only",
    description: "Guests contact you by phone, email or WhatsApp to book.",
    icon: MessageSquare,
  },
];

const CANCELLATION: ChoiceOption<Cancellation>[] = [
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
const DEPOSITS = [
  "No deposit",
  "10% of total price",
  "20% of total price",
  "30% of total price",
  "50% of total price",
  "First night",
  "Full payment",
];
const PAYMENT_METHODS = [
  "Credit / debit card",
  "Cash at property",
  "Bank transfer",
  "KOKO / Mintpay",
  "PayPal",
  "Crypto",
];
const HOUSE_RULES_MAX = 500;

type PoliciesBooking = {
  checkIn: string;
  checkOut: string;
  minStay: string;
  bookAhead: string;
  bookingMode: BookingMode;
  deposit: string;
  alertEmail: string;
  payments: string[];
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
    "policies-booking",
    {
      checkIn: "14:00",
      checkOut: "11:00",
      minStay: MIN_STAYS[0],
      bookAhead: "12 months in advance",
      bookingMode: "instant",
      deposit: "",
      alertEmail: "",
      payments: [],
      cancellation: "flexible",
      children: true,
      pets: false,
      smoking: false,
      houseRules: "",
    },
  );
  const [paymentError, setPaymentError] = useState(false);
  // Contact-only bookings take no money through the website.
  const takesBookings = values.bookingMode !== "contact";

  function togglePayment(method: string) {
    const payments = values.payments.includes(method)
      ? values.payments.filter((item) => item !== method)
      : [...values.payments, method];
    update({ payments });
    if (payments.length) setPaymentError(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (takesBookings && !values.payments.length) {
      setPaymentError(true);
      document
        .getElementById("payments-title")
        ?.scrollIntoView({ block: "start" });
      return;
    }
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
            Choose how bookings from your website work.
          </p>
          <div className="mt-5">
            <ChoiceCards
              name="booking-mode"
              legend="How guests book"
              legendHidden
              options={BOOKING_MODES}
              value={values.bookingMode}
              onChange={(bookingMode) => update({ bookingMode })}
            />
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {takesBookings ? (
              <Field id="deposit" label="Deposit required" required>
                <SelectInput
                  id="deposit"
                  required
                  placeholder="Select deposit"
                  options={DEPOSITS}
                  value={values.deposit}
                  onChange={(event) => update({ deposit: event.target.value })}
                />
              </Field>
            ) : null}
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

        {takesBookings ? (
          <section aria-labelledby="payments-title" className={formCardClass}>
            <h2
              id="payments-title"
              className="text-lg font-semibold text-office-icon"
            >
              Payment methods
            </h2>
            <p className="mt-1 text-sm text-office-muted">
              Select how guests can pay. {values.payments.length} selected.
            </p>
            <div className="mt-5" role="group" aria-labelledby="payments-title">
              <AmenityGrid
                options={PAYMENT_METHODS}
                selected={values.payments}
                onToggle={togglePayment}
              />
            </div>
            {paymentError ? (
              <p
                role="alert"
                className="mt-4 flex items-center gap-2 rounded-lg bg-office-danger-soft px-4 py-3 text-sm text-office-danger-text"
              >
                <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
                Select at least one way guests can pay.
              </p>
            ) : null}
          </section>
        ) : null}

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
        note="Check-in times, payment methods and policies appear on the booking page and in every confirmation email."
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
