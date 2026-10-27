"use client";

import { BASIC_LIMITS, PROPERTY_CATEGORY_LABELS, PROPERTY_TYPE_LABELS } from "../config";
import type { PropertySettings } from "../types";
import { EditableSection } from "./editable-section";
import { DetailList, Field, Select, TextArea, TextInput } from "./settings-fields";

const TYPE_OPTIONS = Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({ value, label }));
const CATEGORY_OPTIONS = [{ value: "", label: "Not set" }, ...Object.entries(PROPERTY_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))];
const starsLabel = (stars: number) => `${stars} Star${stars === 1 ? "" : "s"}`;
const STAR_OPTIONS = [{ value: "", label: "Not rated" }, ...[1, 2, 3, 4, 5].map((stars) => ({ value: String(stars), label: starsLabel(stars) }))];

// Basic Information, beside the logo and status cards (placed by the page grid).
export function BasicInfoForm({ property }: { property: PropertySettings }) {
  const { basic } = property;
  return (
    <EditableSection
      section="basic"
      property={property}
      title="Basic Information"
      viewDescription="Your property's basic details, as shown on your website and booking channels."
      editDescription="Manage your property's basic details. This information will be shown on your website and booking channels."
      firstFieldId="property-name"
      cardClassName="xl:col-start-1 xl:row-start-1"
      barClassName="xl:col-span-2 xl:row-start-2"
      initial={{
        name: basic.name,
        type: basic.type,
        description: basic.description,
        starRating: basic.starRating ? String(basic.starRating) : "",
        establishedYear: basic.establishedYear ? String(basic.establishedYear) : "",
        category: basic.category ?? "",
      }}
      view={
        <DetailList
          rows={[
            { label: "Property name", value: basic.name },
            { label: "Property type", value: PROPERTY_TYPE_LABELS[basic.type] },
            { label: "Short description", value: basic.description, wide: true },
            { label: "Star rating", value: basic.starRating ? starsLabel(basic.starRating) : null },
            { label: "Established year", value: basic.establishedYear ? String(basic.establishedYear) : null },
            { label: "Property category", value: basic.category ? PROPERTY_CATEGORY_LABELS[basic.category] : null },
          ]}
        />
      }
      fields={({ values, set, errors }) => (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="property-name" label="Property name" required error={errors.name}>
            <TextInput id="property-name" name="name" required autoComplete="organization" maxLength={BASIC_LIMITS.name} value={values.name} onValue={set("name")} error={errors.name} />
          </Field>
          <Field id="property-type" label="Property type" required error={errors.type}>
            <Select id="property-type" name="type" value={values.type} options={TYPE_OPTIONS} onValue={set("type")} error={errors.type} />
          </Field>
          <Field id="property-description" label="Short description" required error={errors.description} className="sm:col-span-2">
            <TextArea id="property-description" name="description" value={values.description} onValue={set("description")} max={BASIC_LIMITS.description} error={errors.description} />
          </Field>
          <Field id="property-stars" label="Star rating" error={errors.starRating}>
            <Select id="property-stars" name="starRating" value={values.starRating} options={STAR_OPTIONS} onValue={set("starRating")} error={errors.starRating} />
          </Field>
          <Field id="property-year" label="Established year" error={errors.establishedYear}>
            <TextInput id="property-year" name="establishedYear" inputMode="numeric" maxLength={4} placeholder="e.g. 2015" value={values.establishedYear} onValue={set("establishedYear")} error={errors.establishedYear} />
          </Field>
          <Field id="property-category" label="Property category" error={errors.category}>
            <Select id="property-category" name="category" value={values.category} options={CATEGORY_OPTIONS} onValue={set("category")} error={errors.category} />
          </Field>
        </div>
      )}
    />
  );
}
