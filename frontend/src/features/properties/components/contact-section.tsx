"use client";

import { SRI_LANKA_DISTRICTS } from "../config";
import type { PropertySettings } from "../types";
import { contactPhoneErrors } from "../validation";
import { EditableSection } from "./editable-section";
import { DetailList, Field, Select, SubHeading, TextInput } from "./settings-fields";

const DISTRICT_OPTIONS = [{ value: "", label: "Choose a district" }, ...SRI_LANKA_DISTRICTS.map((district) => ({ value: district, label: district }))];

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-office-link underline-offset-4 hover:underline">
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

// How guests reach the property. Town and country also show in the page header.
export function ContactSection({ property }: { property: PropertySettings }) {
  const { contact } = property;
  const address = [contact.addressLine1, contact.addressLine2, contact.town, contact.district, contact.postalCode, contact.country]
    .filter(Boolean)
    .join(", ");

  return (
    <EditableSection
      section="contact"
      property={property}
      title="Contact & Location"
      viewDescription="How guests reach you and where to find the property."
      editDescription="Guests see these details on your website and in booking confirmations."
      firstFieldId="contact-phone"
      check={contactPhoneErrors}
      initial={{
        phone: contact.phone,
        email: contact.email,
        whatsapp: contact.whatsapp ?? "",
        website: contact.website ?? "",
        addressLine1: contact.addressLine1,
        addressLine2: contact.addressLine2 ?? "",
        town: contact.town,
        district: contact.district,
        postalCode: contact.postalCode ?? "",
        mapUrl: contact.mapUrl ?? "",
      }}
      view={
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-4" aria-label="Contact">
            <SubHeading>Contact</SubHeading>
            <DetailList
              rows={[
                { label: "Phone", value: contact.phone },
                { label: "Email", value: contact.email },
                { label: "WhatsApp", value: contact.whatsapp },
                { label: "Website", value: contact.website ? <ExternalLink href={contact.website}>{contact.website}</ExternalLink> : null },
              ]}
            />
          </section>
          <section className="flex flex-col gap-4" aria-label="Location">
            <SubHeading>Location</SubHeading>
            <DetailList
              rows={[
                { label: "Address", value: address, wide: true },
                { label: "Map link", value: contact.mapUrl ? <ExternalLink href={contact.mapUrl}>Open in maps</ExternalLink> : null },
              ]}
            />
          </section>
        </div>
      }
      fields={({ values, set, errors }) => (
        <div className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-4">
              <SubHeading>Contact</SubHeading>
            </legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="contact-phone" label="Phone" required error={errors.phone}>
                <TextInput id="contact-phone" name="phone" type="tel" autoComplete="tel" placeholder="+94 77 123 4567" value={values.phone} onValue={set("phone")} error={errors.phone} />
              </Field>
              <Field id="contact-email" label="Email" required error={errors.email}>
                <TextInput id="contact-email" name="email" type="email" autoComplete="email" value={values.email} onValue={set("email")} error={errors.email} />
              </Field>
              <Field id="contact-whatsapp" label="WhatsApp number" error={errors.whatsapp}>
                <TextInput id="contact-whatsapp" name="whatsapp" type="tel" placeholder="+94 77 123 4567" value={values.whatsapp} onValue={set("whatsapp")} error={errors.whatsapp} />
              </Field>
              <Field id="contact-website" label="Website" error={errors.website}>
                <TextInput id="contact-website" name="website" type="url" placeholder="https://" value={values.website} onValue={set("website")} error={errors.website} />
              </Field>
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-4">
              <SubHeading>Location</SubHeading>
            </legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="contact-address1" label="Street address" required error={errors.addressLine1} className="sm:col-span-2">
                <TextInput id="contact-address1" name="addressLine1" autoComplete="address-line1" value={values.addressLine1} onValue={set("addressLine1")} error={errors.addressLine1} />
              </Field>
              <Field id="contact-address2" label="Address line 2" error={errors.addressLine2} className="sm:col-span-2">
                <TextInput id="contact-address2" name="addressLine2" autoComplete="address-line2" value={values.addressLine2} onValue={set("addressLine2")} error={errors.addressLine2} />
              </Field>
              <Field id="contact-town" label="Town or city" required error={errors.town}>
                <TextInput id="contact-town" name="town" autoComplete="address-level2" value={values.town} onValue={set("town")} error={errors.town} />
              </Field>
              <Field id="contact-district" label="District" required error={errors.district}>
                <Select id="contact-district" name="district" value={values.district} options={DISTRICT_OPTIONS} onValue={set("district")} error={errors.district} />
              </Field>
              <Field id="contact-postal" label="Postal code" error={errors.postalCode}>
                <TextInput id="contact-postal" name="postalCode" inputMode="numeric" maxLength={5} autoComplete="postal-code" value={values.postalCode} onValue={set("postalCode")} error={errors.postalCode} />
              </Field>
              <Field id="contact-country" label="Country" required hint="Sanchara lists properties in Sri Lanka only.">
                <TextInput id="contact-country" autoComplete="country-name" value={contact.country} onValue={() => undefined} hint readOnly className="bg-office-header text-office-muted" />
              </Field>
              <Field id="contact-map" label="Google Maps link" hint="Open the property in Google Maps, choose Share, then copy the link." error={errors.mapUrl} className="sm:col-span-2">
                <TextInput id="contact-map" name="mapUrl" type="url" placeholder="https://maps.app.goo.gl/…" hint value={values.mapUrl} onValue={set("mapUrl")} error={errors.mapUrl} />
              </Field>
            </div>
          </fieldset>
        </div>
      )}
    />
  );
}
