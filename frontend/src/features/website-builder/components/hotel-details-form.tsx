"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, Star } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";

const DRAFT_KEY = "sanchara:website-template:hotel-details";
const DESCRIPTION_MAX = 300;
const FORM_STEP = 1;
const FORM_STEPS = 6;

const PROPERTY_TYPES = [
  "Guest House",
  "Hotel",
  "Boutique Hotel",
  "Villa",
  "Resort",
  "Homestay",
  "Hostel",
];

type HotelDetails = {
  name: string;
  type: string;
  stars: number;
  established: string;
  tagline: string;
  description: string;
};

const inputClass =
  "focus-ring h-11 w-full rounded-lg border border-office-meter-track bg-card px-3.5 text-sm text-foreground placeholder:text-office-muted/70";

// Step 1 of the hotel template form. Until the builder API exists the draft
// lives in this browser only.
export function HotelDetailsForm({ hotelName }: { hotelName: string }) {
  const router = useRouter();
  const [details, setDetails] = useState<HotelDetails>({
    name: hotelName,
    type: "",
    stars: 0,
    established: "",
    tagline: "",
    description: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const draft = window.localStorage.getItem(DRAFT_KEY);
      if (draft) {
        setDetails((current) => ({ ...current, ...JSON.parse(draft) }));
        setSaved(true);
      }
    } catch {
      // No storage (private window, blocked site data): start empty.
    }
  }, []);

  function update<K extends keyof HotelDetails>(
    key: K,
    value: HotelDetails[K],
  ) {
    setDetails((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function saveDraft() {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(details));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveDraft();
    router.push(`${COMPANY_PATHS.website}/template-form/brand`);
  }

  const percent = Math.round((FORM_STEP / FORM_STEPS) * 100);

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <form
        id="hotel-details-form"
        onSubmit={handleSubmit}
        className="min-w-0 flex-1 rounded-2xl border border-office-meter-track bg-card p-5 shadow-[0_4px_16px_rgb(15_107_110/0.06)] sm:p-6"
      >
        <h2 className="text-lg font-semibold text-office-icon">
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
              onChange={(event) => update("name", event.target.value)}
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
                onChange={(event) => update("type", event.target.value)}
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
            onChange={(stars) => update("stars", stars)}
          />
          <Field id="year-established" label="Year established" hint="Optional">
            <input
              id="year-established"
              type="number"
              inputMode="numeric"
              min={1800}
              max={new Date().getFullYear()}
              value={details.established}
              onChange={(event) => update("established", event.target.value)}
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
              onChange={(event) => update("tagline", event.target.value)}
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
              onChange={(event) => update("description", event.target.value)}
              placeholder="A peaceful guest house by the southern coast of Sri Lanka. Comfortable rooms, ocean views and warm hospitality in Galle."
              className={cn(inputClass, "h-auto resize-y py-3 leading-relaxed")}
            />
          </Field>
        </div>
      </form>

      <aside
        aria-label="Your progress"
        className="rounded-2xl border border-office-meter-track bg-card p-5 shadow-[0_4px_16px_rgb(15_107_110/0.06)] xl:sticky xl:top-24 xl:w-80 xl:shrink-0"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-office-icon">Your progress</h2>
          <span className="rounded-full bg-office-tint-teal px-2 py-0.5 text-xs font-medium text-office-primary">
            Sanchara Hotel Template
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="font-medium text-office-icon">
            Step {FORM_STEP} of {FORM_STEPS}
          </span>
          <span className="font-medium text-office-primary">
            {percent}% complete
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Template progress"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-2 h-2 overflow-hidden rounded-full bg-office-meter-track"
        >
          <div
            className="h-full rounded-full bg-office-primary"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-office-muted">
          Your details are placed into the Sanchara hotel template
          automatically. You can come back and edit any answer before
          publishing.
        </p>
        <Button
          type="submit"
          form="hotel-details-form"
          variant="office"
          className="mt-5 h-11 w-full gap-2.5 text-[0.95rem] font-semibold"
        >
          Save &amp; continue
          <ArrowRight aria-hidden="true" className="size-[18px]" />
        </Button>
        <Button
          asChild
          variant="outline"
          className="mt-3 h-11 w-full border-office-meter-track bg-card text-[0.95rem] font-semibold text-office-icon hover:bg-office-chip"
        >
          <Link href={`${COMPANY_PATHS.website}/templates`}>Back</Link>
        </Button>
        <div className="mt-4 flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={saveDraft}
            className="focus-ring rounded font-semibold text-office-primary hover:underline"
          >
            Save as draft
          </button>
          <span role="status" className="text-office-muted">
            {saved ? "All changes saved · just now" : "Unsaved changes"}
          </span>
        </div>
      </aside>
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
};

function Field({ id, label, hint, required, className, children }: FieldProps) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-office-icon">
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </label>
        {hint ? (
          <span className="text-xs text-office-muted">{hint}</span>
        ) : null}
      </div>
      {children}
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
