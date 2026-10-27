"use client";

import { CANCELLATION_META, POLICY_LIMITS, SMOKING_LABELS } from "../config";
import type { PropertySettings } from "../types";
import { EditableSection } from "./editable-section";
import { DetailList, Field, Select, SubHeading, TextArea, TextInput } from "./settings-fields";

const CANCELLATION_OPTIONS = Object.entries(CANCELLATION_META).map(([value, meta]) => ({ value, label: meta.label }));
const SMOKING_OPTIONS = Object.entries(SMOKING_LABELS).map(([value, label]) => ({ value, label }));
const YES_NO = [
  { value: "yes", label: "Allowed" },
  { value: "no", label: "Not allowed" },
];

// "14:00" → "2:00 PM"
function timeLabel(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" }).format(
    new Date(Date.UTC(2000, 0, 1, hours, minutes)),
  );
}

// Check-in/out times and house rules shown to guests before they book.
export function PoliciesSection({ property }: { property: PropertySettings }) {
  const { policies } = property;
  const cancellation = CANCELLATION_META[policies.cancellation];

  return (
    <EditableSection
      section="policies"
      property={property}
      title="Policies"
      viewDescription="Check-in, cancellation and house rules guests agree to when they book."
      editDescription="Guests see these policies before they book and in their confirmation."
      firstFieldId="policy-check-in-from"
      initial={{
        checkInFrom: policies.checkInFrom,
        checkInUntil: policies.checkInUntil ?? "",
        checkOutBy: policies.checkOutBy,
        cancellation: policies.cancellation,
        childrenAllowed: policies.childrenAllowed ? "yes" : "no",
        petsAllowed: policies.petsAllowed ? "yes" : "no",
        smoking: policies.smoking,
        houseRules: policies.houseRules,
      }}
      view={
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-4" aria-label="Check-in and check-out">
            <SubHeading>Check-in &amp; check-out</SubHeading>
            <DetailList
              rows={[
                {
                  label: "Check-in",
                  value: policies.checkInUntil
                    ? `${timeLabel(policies.checkInFrom)} – ${timeLabel(policies.checkInUntil)}`
                    : `From ${timeLabel(policies.checkInFrom)}`,
                },
                { label: "Check-out", value: `By ${timeLabel(policies.checkOutBy)}` },
              ]}
            />
          </section>
          <section className="flex flex-col gap-4" aria-label="Cancellation">
            <SubHeading>Cancellation</SubHeading>
            <DetailList rows={[{ label: cancellation.label, value: cancellation.description, wide: true }]} />
          </section>
          <section className="flex flex-col gap-4" aria-label="House rules">
            <SubHeading>House rules</SubHeading>
            <DetailList
              rows={[
                { label: "Children", value: policies.childrenAllowed ? "Allowed" : "Not allowed" },
                { label: "Pets", value: policies.petsAllowed ? "Allowed" : "Not allowed" },
                { label: "Smoking", value: SMOKING_LABELS[policies.smoking] },
                { label: "Other rules", value: policies.houseRules ? <span className="whitespace-pre-line">{policies.houseRules}</span> : null, wide: true },
              ]}
            />
          </section>
        </div>
      }
      fields={({ values, set, errors }) => (
        <div className="flex flex-col gap-6">
          <fieldset>
            <legend className="mb-4">
              <SubHeading>Check-in &amp; check-out</SubHeading>
            </legend>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field id="policy-check-in-from" label="Check-in from" required error={errors.checkInFrom}>
                <TextInput id="policy-check-in-from" name="checkInFrom" type="time" value={values.checkInFrom} onValue={set("checkInFrom")} error={errors.checkInFrom} />
              </Field>
              <Field id="policy-check-in-until" label="Check-in until" error={errors.checkInUntil}>
                <TextInput id="policy-check-in-until" name="checkInUntil" type="time" value={values.checkInUntil} onValue={set("checkInUntil")} error={errors.checkInUntil} />
              </Field>
              <Field id="policy-check-out" label="Check-out by" required error={errors.checkOutBy}>
                <TextInput id="policy-check-out" name="checkOutBy" type="time" value={values.checkOutBy} onValue={set("checkOutBy")} error={errors.checkOutBy} />
              </Field>
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-4">
              <SubHeading>Cancellation</SubHeading>
            </legend>
            <Field
              id="policy-cancellation"
              label="Cancellation policy"
              required
              hint={CANCELLATION_META[values.cancellation as keyof typeof CANCELLATION_META]?.description}
              error={errors.cancellation}
              className="sm:max-w-sm"
            >
              <Select id="policy-cancellation" name="cancellation" value={values.cancellation} options={CANCELLATION_OPTIONS} onValue={set("cancellation")} error={errors.cancellation} />
            </Field>
          </fieldset>
          <fieldset>
            <legend className="mb-4">
              <SubHeading>House rules</SubHeading>
            </legend>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field id="policy-children" label="Children" required error={errors.childrenAllowed}>
                <Select id="policy-children" name="childrenAllowed" value={values.childrenAllowed} options={YES_NO} onValue={set("childrenAllowed")} error={errors.childrenAllowed} />
              </Field>
              <Field id="policy-pets" label="Pets" required error={errors.petsAllowed}>
                <Select id="policy-pets" name="petsAllowed" value={values.petsAllowed} options={YES_NO} onValue={set("petsAllowed")} error={errors.petsAllowed} />
              </Field>
              <Field id="policy-smoking" label="Smoking" required error={errors.smoking}>
                <Select id="policy-smoking" name="smoking" value={values.smoking} options={SMOKING_OPTIONS} onValue={set("smoking")} error={errors.smoking} />
              </Field>
              <Field id="policy-rules" label="Other house rules" error={errors.houseRules} className="sm:col-span-3">
                <TextArea id="policy-rules" name="houseRules" rows={4} value={values.houseRules} onValue={set("houseRules")} max={POLICY_LIMITS.houseRules} error={errors.houseRules} />
              </Field>
            </div>
          </fieldset>
        </div>
      )}
    />
  );
}
