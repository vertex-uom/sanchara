"use client";

import { Info } from "lucide-react";
import { ADVANCED_LIMITS, PROPERTY_CURRENCIES, PROPERTY_TIME_ZONE } from "../config";
import type { PropertySettings } from "../types";
import { EditableSection } from "./editable-section";
import { DetailList, Field, SubHeading, TextInput } from "./settings-fields";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

// Registration numbers, invoice numbering and booking limits. Time zone and
// currencies are platform-wide and shown read-only.
export function AdvancedSection({ property }: { property: PropertySettings }) {
  const { advanced } = property;
  const { bookingWindowDays: window, minNoticeHours: notice } = ADVANCED_LIMITS;

  return (
    <EditableSection
      section="advanced"
      property={property}
      title="Advanced"
      viewDescription="Registration, invoicing and booking limits."
      editDescription="These settings affect invoices and when guests can book."
      firstFieldId="advanced-sltda"
      initial={{
        sltdaNumber: advanced.sltdaNumber ?? "",
        vatNumber: advanced.vatNumber ?? "",
        invoicePrefix: advanced.invoicePrefix,
        bookingWindowDays: String(advanced.bookingWindowDays),
        minNoticeHours: String(advanced.minNoticeHours),
      }}
      view={
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-4" aria-label="Registration and invoices">
            <SubHeading>Registration &amp; invoices</SubHeading>
            <DetailList
              rows={[
                { label: "SLTDA registration number", value: advanced.sltdaNumber },
                { label: "VAT registration number", value: advanced.vatNumber },
                { label: "Invoice number prefix", value: `${advanced.invoicePrefix} (e.g. ${advanced.invoicePrefix}-0001)` },
              ]}
            />
          </section>
          <section className="flex flex-col gap-4" aria-label="Booking limits">
            <SubHeading>Booking limits</SubHeading>
            <DetailList
              rows={[
                { label: "Booking window", value: `Up to ${plural(advanced.bookingWindowDays, "day")} ahead` },
                {
                  label: "Minimum notice",
                  value: advanced.minNoticeHours === 0 ? "Same-day bookings allowed" : `${plural(advanced.minNoticeHours, "hour")} before check-in`,
                },
              ]}
            />
          </section>
          <section className="flex flex-col gap-4" aria-label="Platform settings">
            <SubHeading>Platform settings</SubHeading>
            <DetailList
              rows={[
                { label: "Time zone", value: PROPERTY_TIME_ZONE },
                { label: "Currencies", value: PROPERTY_CURRENCIES },
              ]}
            />
          </section>
        </div>
      }
      fields={({ values, set, errors }) => (
        <div className="flex flex-col gap-6">
          <fieldset>
            <legend className="mb-4">
              <SubHeading>Registration &amp; invoices</SubHeading>
            </legend>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field id="advanced-sltda" label="SLTDA registration number" error={errors.sltdaNumber}>
                <TextInput id="advanced-sltda" name="sltdaNumber" spellCheck={false} value={values.sltdaNumber} onValue={set("sltdaNumber")} error={errors.sltdaNumber} />
              </Field>
              <Field id="advanced-vat" label="VAT registration number" error={errors.vatNumber}>
                <TextInput id="advanced-vat" name="vatNumber" inputMode="numeric" placeholder="123456789-7000" value={values.vatNumber} onValue={set("vatNumber")} error={errors.vatNumber} />
              </Field>
              <Field id="advanced-prefix" label="Invoice number prefix" required hint="2 to 6 letters or numbers." error={errors.invoicePrefix}>
                <TextInput
                  id="advanced-prefix"
                  name="invoicePrefix"
                  maxLength={6}
                  hint
                  value={values.invoicePrefix}
                  onValue={(value) => set("invoicePrefix")(value.toUpperCase())}
                  error={errors.invoicePrefix}
                  className="uppercase"
                />
              </Field>
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-4">
              <SubHeading>Booking limits</SubHeading>
            </legend>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field id="advanced-window" label="Booking window (days)" required hint={`How far ahead guests can book: ${window.min} to ${window.max} days.`} error={errors.bookingWindowDays}>
                <TextInput id="advanced-window" name="bookingWindowDays" inputMode="numeric" hint value={values.bookingWindowDays} onValue={set("bookingWindowDays")} error={errors.bookingWindowDays} />
              </Field>
              <Field id="advanced-notice" label="Minimum notice (hours)" required hint={`0 allows same-day bookings; up to ${notice.max} hours.`} error={errors.minNoticeHours}>
                <TextInput id="advanced-notice" name="minNoticeHours" inputMode="numeric" hint value={values.minNoticeHours} onValue={set("minNoticeHours")} error={errors.minNoticeHours} />
              </Field>
            </div>
          </fieldset>
          <p className="flex gap-2 rounded-lg bg-office-chip p-3 text-sm text-office-label">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-office-icon" />
            Time zone ({PROPERTY_TIME_ZONE}) and currencies ({PROPERTY_CURRENCIES}) are set by the platform.
          </p>
        </div>
      )}
    />
  );
}
