"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Star } from "lucide-react";
import { cn } from "cn";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { ChipPicker } from "./chip-picker";
import { ImageUpload } from "./image-upload";
import { useTemplateDraft } from "./template-draft";
import { Field, formCardClass, inputClass } from "./template-fields";
import { TemplateProgress } from "./template-progress";

const DESCRIPTION_MAX = 300;
const STORY_MAX = 800;
const HIGHLIGHTS_MAX = 6;
const MB = 1024 * 1024;

const HIGHLIGHTS = [
  "Beachfront",
  "Family friendly",
  "Free breakfast",
  "Ocean view",
  "Pet friendly",
  "Eco friendly",
  "Airport pickup",
];
const LANGUAGES = ["English", "Sinhala", "Tamil", "German"];

type Images = { logo: File | null; cover: File | null; about: File | null };

const PROPERTY_TYPES = [
  "Guest House",
  "Hotel",
  "Boutique Hotel",
  "Villa",
  "Resort",
  "Homestay",
  "Hostel",
];

// Step 1 of the hotel template form. Until the builder API exists the draft
// lives in this browser only, and images are kept in memory (not in the draft).
export function HotelDetailsForm({ hotelName }: { hotelName: string }) {
  const router = useRouter();
  const {
    values: details,
    update,
    save,
    saved,
  } = useTemplateDraft("hotel-details", {
    name: hotelName,
    type: "",
    stars: 0,
    established: "",
    tagline: "",
    description: "",
    story: "",
    highlights: [] as string[],
    customHighlights: [] as string[],
    languages: [] as string[],
    customLanguages: [] as string[],
  });
  const [images, setImages] = useState<Images>({
    logo: null,
    cover: null,
    about: null,
  });
  const [attempted, setAttempted] = useState(false);

  function toggle(list: string[], option: string) {
    return list.includes(option)
      ? list.filter((item) => item !== option)
      : [...list, option];
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    // Native checks cover the text fields; the required images are checked here.
    const missing = (["logo", "cover"] as const).find((key) => !images[key]);
    if (missing) {
      document
        .getElementById(`${missing}-upload`)
        ?.parentElement?.scrollIntoView({ block: "center" });
      return;
    }
    save();
    router.push(`${COMPANY_PATHS.website}/template-form/brand`);
  }

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <form
        id="hotel-details-form"
        onSubmit={handleSubmit}
        className="flex min-w-0 flex-1 flex-col gap-5"
      >
        <section aria-labelledby="basic-info-title" className={formCardClass}>
          <h2
            id="basic-info-title"
            className="text-lg font-semibold text-office-icon"
          >
            Basic information
          </h2>
          <p className="mt-1 text-sm text-office-muted">
            This appears in your website header, page titles and search results.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field id="hotel-name" label="Hotel name" required>
              <input
                id="hotel-name"
                required
                value={details.name}
                onChange={(event) => update({ name: event.target.value })}
                placeholder="Palm Breeze Guest House"
                className={inputClass}
              />
            </Field>
            <Field id="property-type" label="Property type" required>
              <div className="relative">
                <select
                  id="property-type"
                  required
                  value={details.type}
                  onChange={(event) => update({ type: event.target.value })}
                  className={cn(
                    inputClass,
                    "cursor-pointer appearance-none pr-10",
                    !details.type && "text-office-muted",
                  )}
                >
                  <option value="" disabled>
                    Select property type
                  </option>
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-office-icon"
                />
              </div>
            </Field>
            <StarRating
              value={details.stars}
              onChange={(stars) => update({ stars })}
            />
            <Field
              id="year-established"
              label="Year established"
              hint="Optional"
            >
              <input
                id="year-established"
                type="number"
                inputMode="numeric"
                min={1800}
                max={new Date().getFullYear()}
                value={details.established}
                onChange={(event) =>
                  update({ established: event.target.value })
                }
                placeholder="2016"
                className={inputClass}
              />
            </Field>
            <Field
              id="tagline"
              label="Tagline"
              hint="Shown under your hotel name"
              required
              className="sm:col-span-2"
            >
              <input
                id="tagline"
                required
                maxLength={80}
                value={details.tagline}
                onChange={(event) => update({ tagline: event.target.value })}
                placeholder="Relax. Explore. Feel at Home."
                className={inputClass}
              />
            </Field>
            <Field
              id="short-description"
              label="Short description"
              hint={`${details.description.length} / ${DESCRIPTION_MAX}`}
              required
              className="sm:col-span-2"
            >
              <textarea
                id="short-description"
                required
                rows={3}
                maxLength={DESCRIPTION_MAX}
                value={details.description}
                onChange={(event) =>
                  update({ description: event.target.value })
                }
                placeholder="A peaceful guest house by the southern coast of Sri Lanka. Comfortable rooms, ocean views and warm hospitality in Galle."
                className={cn(
                  inputClass,
                  "h-auto resize-y py-3 leading-relaxed",
                )}
              />
            </Field>
          </div>
        </section>

        <section aria-labelledby="logo-cover-title" className={formCardClass}>
          <h2
            id="logo-cover-title"
            className="text-lg font-semibold text-office-icon"
          >
            Logo &amp; cover photo
          </h2>
          <p className="mt-1 text-sm text-office-muted">
            Upload your logo and the main photo guests see first on your home
            page.
          </p>
          <div className="mt-5 flex flex-col gap-5">
            <ImageUpload
              id="logo-upload"
              label="Logo"
              hint="PNG or SVG, up to 2 MB"
              required
              types={["image/png", "image/svg+xml"]}
              maxBytes={2 * MB}
              fit="contain"
              file={images.logo}
              onChange={(logo) =>
                setImages((current) => ({ ...current, logo }))
              }
              missing={attempted}
            />
            <ImageUpload
              id="cover-upload"
              label="Cover photo"
              hint="JPG or PNG, at least 1920 × 1080"
              required
              types={["image/jpeg", "image/png"]}
              maxBytes={10 * MB}
              minSize={{ width: 1920, height: 1080 }}
              usage="Used in the home page banner"
              file={images.cover}
              onChange={(cover) =>
                setImages((current) => ({ ...current, cover }))
              }
              missing={attempted}
            />
          </div>
        </section>

        <section aria-labelledby="about-title" className={formCardClass}>
          <h2
            id="about-title"
            className="text-lg font-semibold text-office-icon"
          >
            About your property
          </h2>
          <p className="mt-1 text-sm text-office-muted">
            Tell guests your story. This fills the About section of your
            website.
          </p>
          <div className="mt-5 flex flex-col gap-5">
            <Field
              id="your-story"
              label="Your story"
              hint={`${details.story.length} / ${STORY_MAX}`}
              required
            >
              <textarea
                id="your-story"
                required
                rows={4}
                maxLength={STORY_MAX}
                value={details.story}
                onChange={(event) => update({ story: event.target.value })}
                placeholder="Palm Breeze began as a small family home by the sea. Today we welcome travellers from around the world with fresh breakfasts, friendly local guides and rooms just steps from the beach."
                className={cn(
                  inputClass,
                  "h-auto resize-y py-3 leading-relaxed",
                )}
              />
            </Field>
            <ImageUpload
              id="about-upload"
              label="About photo"
              hint="JPG or PNG, up to 5 MB"
              types={["image/jpeg", "image/png"]}
              maxBytes={5 * MB}
              file={images.about}
              onChange={(about) =>
                setImages((current) => ({ ...current, about }))
              }
            />
            <ChipPicker
              label="Property highlights"
              hint={`Choose up to ${HIGHLIGHTS_MAX}`}
              options={[...HIGHLIGHTS, ...details.customHighlights]}
              selected={details.highlights}
              max={HIGHLIGHTS_MAX}
              addLabel="Add highlight"
              onToggle={(option) =>
                update({ highlights: toggle(details.highlights, option) })
              }
              onAdd={(option) =>
                update({
                  customHighlights: [...details.customHighlights, option],
                  highlights: [...details.highlights, option],
                })
              }
            />
            <ChipPicker
              label="Languages spoken"
              options={[...LANGUAGES, ...details.customLanguages]}
              selected={details.languages}
              addLabel="Add language"
              onToggle={(option) =>
                update({ languages: toggle(details.languages, option) })
              }
              onAdd={(option) =>
                update({
                  customLanguages: [...details.customLanguages, option],
                  languages: [...details.languages, option],
                })
              }
            />
          </div>
        </section>
      </form>

      <TemplateProgress
        formStep={1}
        note="Your details are placed into the Sanchara hotel template automatically. You can come back and edit any answer before publishing."
        formId="hotel-details-form"
        backHref={`${COMPANY_PATHS.website}/templates`}
        onSaveDraft={save}
        saved={saved}
      />
    </div>
  );
}

// Five radio buttons drawn as stars; arrow keys move between them.
function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (stars: number) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-office-icon">
        Star rating
      </legend>
      <div className="flex h-11 items-center gap-3 rounded-lg border border-office-meter-track bg-card px-3.5 has-focus-visible:ring-2 has-focus-visible:ring-office-primary">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <label key={star} className="cursor-pointer">
              <input
                type="radio"
                name="star-rating"
                value={star}
                checked={value === star}
                onChange={() => onChange(star)}
                className="sr-only"
              />
              <span className="sr-only">{star} star</span>
              <Star
                aria-hidden="true"
                className={cn(
                  "size-5",
                  star <= value
                    ? "fill-amber-400 text-amber-400"
                    : "text-office-muted/50",
                )}
              />
            </label>
          ))}
        </div>
        <span className="text-sm text-office-muted">
          {value ? `${value}-star property` : "Not rated"}
        </span>
      </div>
    </fieldset>
  );
}
