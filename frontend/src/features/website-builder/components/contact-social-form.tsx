"use client";

import { type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Binoculars,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
} from "lucide-react";
import { cn } from "cn";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { PinMap, type PinPosition } from "./pin-map";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  YouTubeIcon,
} from "./social-icons";
import { DRAFT_KEYS, useTemplateDraft } from "./template-draft";
import {
  AffixInput,
  Field,
  formCardClass,
  inputClass,
  SelectInput,
  ToggleRow,
} from "./template-fields";
import { TemplateProgress } from "./template-progress";
import { WebsitePages } from "./website-pages";

const FORM_PATH = `${COMPANY_PATHS.website}/template-form`;

const COUNTRIES = [
  "Sri Lanka",
  "India",
  "Maldives",
  "Thailand",
  "United Kingdom",
  "Other",
];
const DESK_HOURS = [
  "Open 24 hours",
  "6:00 AM – 10:00 PM",
  "7:00 AM – 9:00 PM",
  "8:00 AM – 8:00 PM",
  "9:00 AM – 6:00 PM",
];
const DIRECTIONS_MAX = 300;
const iconClass = "size-4 text-office-icon";

export type ContactSocial = {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  pin: PinPosition;
  directions: string;
  phone: string;
  whatsapp: string;
  email: string;
  deskHours: string;
  whatsappButton: boolean;
  facebook: string;
  instagram: string;
  tiktok: string;
  tripadvisor: string;
  youtube: string;
  listing: string;
  pages: string[];
};

type ContactSocialFormProps = {
  hotelName: string;
  // From the property record, so the address starts filled in.
  city: string;
  country: string;
};

// Step 6, the last form step: address, contact numbers, social links and menu pages.
export function ContactSocialForm({
  hotelName,
  city,
  country,
}: ContactSocialFormProps) {
  const router = useRouter();
  const { values, update, save, saved } = useTemplateDraft<ContactSocial>(
    DRAFT_KEYS.contact,
    {
      street: "",
      city,
      postalCode: "",
      country: COUNTRIES.includes(country) ? country : "",
      pin: { x: 50, y: 42 },
      directions: "",
      phone: "",
      whatsapp: "",
      email: "",
      deskHours: DESK_HOURS[0],
      whatsappButton: true,
      facebook: "",
      instagram: "",
      tiktok: "",
      tripadvisor: "",
      youtube: "",
      listing: "",
      pages: ["Gallery", "Reviews", "Contact"],
    },
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save();
    router.push(`${FORM_PATH}/review`);
  }

  function togglePage(page: string) {
    update({
      pages: values.pages.includes(page)
        ? values.pages.filter((item) => item !== page)
        : [...values.pages, page],
    });
  }

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <form
        id="contact-social-form"
        onSubmit={handleSubmit}
        className="flex min-w-0 flex-1 flex-col gap-5"
      >
        <section aria-labelledby="location-title" className={formCardClass}>
          <h2
            id="location-title"
            className="text-lg font-semibold text-office-icon"
          >
            Location
          </h2>
          <p className="mt-1 text-sm text-office-muted">
            Guests use this to find you. It appears on the Contact page with a
            map.
          </p>
          <Field id="street" label="Street address" required className="mt-5">
            <AffixInput
              id="street"
              required
              autoComplete="street-address"
              prefix={<MapPin aria-hidden="true" className={iconClass} />}
              value={values.street}
              onChange={(event) => update({ street: event.target.value })}
              placeholder="No. 24, Lighthouse Street, Galle Fort"
            />
          </Field>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <Field id="city" label="City" required>
              <input
                id="city"
                required
                autoComplete="address-level2"
                value={values.city}
                onChange={(event) => update({ city: event.target.value })}
                placeholder="Galle"
                className={inputClass}
              />
            </Field>
            <Field id="postal-code" label="Postal code">
              <input
                id="postal-code"
                autoComplete="postal-code"
                value={values.postalCode}
                onChange={(event) => update({ postalCode: event.target.value })}
                placeholder="80000"
                className={inputClass}
              />
            </Field>
            <Field id="country" label="Country" required>
              <SelectInput
                id="country"
                required
                placeholder="Select country"
                options={COUNTRIES}
                value={values.country}
                onChange={(event) => update({ country: event.target.value })}
              />
            </Field>
          </div>
          <div className="mt-5">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-office-icon">
                Map location
              </span>
              <span className="text-xs text-office-muted">
                Drag the pin to your exact location
              </span>
            </div>
            <PinMap
              label={hotelName || "Your property"}
              pin={values.pin}
              onChange={(pin) => update({ pin })}
            />
          </div>
          <Field
            id="directions"
            label="How to get here"
            hint={`Optional · ${values.directions.length} / ${DIRECTIONS_MAX}`}
            className="mt-5"
          >
            <textarea
              id="directions"
              rows={2}
              maxLength={DIRECTIONS_MAX}
              value={values.directions}
              onChange={(event) => update({ directions: event.target.value })}
              placeholder="15 minutes from Galle bus station. Free pickup from the railway station on request."
              className={cn(inputClass, "h-auto resize-y py-3 leading-relaxed")}
            />
          </Field>
        </section>

        <section aria-labelledby="contact-title" className={formCardClass}>
          <h2
            id="contact-title"
            className="text-lg font-semibold text-office-icon"
          >
            Contact details
          </h2>
          <p className="mt-1 text-sm text-office-muted">
            Shown in the header, footer and Contact page.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field id="phone" label="Phone number" required>
              <PhoneInput
                id="phone"
                required
                icon={<Phone aria-hidden="true" className={iconClass} />}
                value={values.phone}
                onChange={(phone) => update({ phone })}
              />
            </Field>
            <Field id="whatsapp" label="WhatsApp number">
              <PhoneInput
                id="whatsapp"
                icon={
                  <MessageSquare aria-hidden="true" className={iconClass} />
                }
                value={values.whatsapp}
                onChange={(whatsapp) => update({ whatsapp })}
              />
            </Field>
            <Field id="email" label="Email address" required>
              <AffixInput
                id="email"
                type="email"
                required
                autoComplete="email"
                prefix={<Mail aria-hidden="true" className={iconClass} />}
                value={values.email}
                onChange={(event) => update({ email: event.target.value })}
                placeholder="hello@palmbreeze.lk"
              />
            </Field>
            <Field id="desk-hours" label="Front desk hours">
              <SelectInput
                id="desk-hours"
                options={DESK_HOURS}
                value={values.deskHours}
                onChange={(event) => update({ deskHours: event.target.value })}
              />
            </Field>
          </div>
          <div className="mt-5">
            <ToggleRow
              id="whatsapp-button"
              label="Show WhatsApp chat button"
              description="Adds a floating WhatsApp button so guests can message you from any page."
              checked={values.whatsappButton}
              onChange={(whatsappButton) => update({ whatsappButton })}
            />
          </div>
        </section>

        <section aria-labelledby="social-title" className={formCardClass}>
          <h2
            id="social-title"
            className="text-lg font-semibold text-office-icon"
          >
            Social media
          </h2>
          <p className="mt-1 text-sm text-office-muted">
            Add links to your profiles. Icons appear in the website footer.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <SocialField
              id="facebook"
              label="Facebook"
              icon={<FacebookIcon className={iconClass} />}
              value={values.facebook}
              onChange={(facebook) => update({ facebook })}
              placeholder="facebook.com/palmbreezegalle"
            />
            <SocialField
              id="instagram"
              label="Instagram"
              icon={<InstagramIcon className={iconClass} />}
              value={values.instagram}
              onChange={(instagram) => update({ instagram })}
              placeholder="@palmbreeze.galle"
            />
            <SocialField
              id="tiktok"
              label="TikTok"
              icon={<TikTokIcon className={iconClass} />}
              value={values.tiktok}
              onChange={(tiktok) => update({ tiktok })}
              placeholder="@palmbreeze"
            />
            <SocialField
              id="tripadvisor"
              label="TripAdvisor"
              icon={<Binoculars aria-hidden="true" className={iconClass} />}
              value={values.tripadvisor}
              onChange={(tripadvisor) => update({ tripadvisor })}
              placeholder="tripadvisor.com/palm-breeze"
            />
            <SocialField
              id="youtube"
              label="YouTube"
              optional
              icon={<YouTubeIcon className={iconClass} />}
              value={values.youtube}
              onChange={(youtube) => update({ youtube })}
              placeholder="Add your channel link"
            />
            <SocialField
              id="listing"
              label="Booking.com / Airbnb"
              optional
              icon={<Globe aria-hidden="true" className={iconClass} />}
              value={values.listing}
              onChange={(listing) => update({ listing })}
              placeholder="Add your listing link"
            />
          </div>
        </section>

        <section aria-labelledby="pages-title" className={formCardClass}>
          <h2
            id="pages-title"
            className="text-lg font-semibold text-office-icon"
          >
            Website pages
          </h2>
          <p className="mt-1 text-sm text-office-muted">
            Choose which pages appear in your website menu.
          </p>
          <div className="mt-5">
            <WebsitePages enabled={values.pages} onToggle={togglePage} />
          </div>
        </section>
      </form>

      <TemplateProgress
        formStep={6}
        note="This is the last step. Next you can review all your answers and see your full website before publishing."
        formId="contact-social-form"
        continueLabel="Save & review"
        backHref={`${FORM_PATH}/policies`}
        onSaveDraft={save}
        saved={saved}
      />
    </div>
  );
}

// Sri Lankan number after a fixed +94 prefix (no leading 0).
function PhoneInput({
  id,
  icon,
  required,
  value,
  onChange,
}: {
  id: string;
  icon: ReactNode;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <AffixInput
      id={id}
      type="tel"
      required={required}
      autoComplete="tel-national"
      inputMode="tel"
      pattern="[0-9 ]{9,12}"
      title="Enter the number without the leading 0, for example 77 123 4567"
      prefix={
        <>
          {icon}
          <span>+94</span>
        </>
      }
      value={value}
      onChange={(event) => onChange(event.target.value.replace(/[^\d ]/g, ""))}
      placeholder="77 123 4567"
    />
  );
}

function SocialField({
  id,
  label,
  optional,
  icon,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  optional?: boolean;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Field id={id} label={label} hint={optional ? "Optional" : undefined}>
      <AffixInput
        id={id}
        prefix={icon}
        value={value}
        onChange={(event) => onChange(event.target.value.trim())}
        placeholder={placeholder}
      />
    </Field>
  );
}
