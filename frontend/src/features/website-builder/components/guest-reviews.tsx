"use client";

import { useState } from "react";
import { Check, Info, Star } from "lucide-react";
import { cn } from "cn";
import { EditorPanel, RowActions } from "./list-editor";
import { AddButton, Field, inputClass, ToggleRow } from "./template-fields";

export type Review = {
  id: string;
  name: string;
  country: string;
  rating: number;
  text: string;
};

export type ReviewSource = "manual" | "google" | "tripadvisor";

const SOURCES: { value: ReviewSource; label: string }[] = [
  { value: "manual", label: "Add manually" },
  { value: "google", label: "Import from Google" },
  { value: "tripadvisor", label: "Import from TripAdvisor" },
];
const REVIEW_MAX = 300;

type GuestReviewsProps = {
  show: boolean;
  source: ReviewSource;
  reviews: Review[];
  onChange: (patch: {
    showReviews?: boolean;
    reviewSource?: ReviewSource;
    reviews?: Review[];
  }) => void;
};

export function GuestReviews({
  show,
  source,
  reviews,
  onChange,
}: GuestReviewsProps) {
  // Review being edited: an id, "new", or null.
  const [editing, setEditing] = useState<string | null>(null);
  const importing = SOURCES.find(
    (option) => option.value === source && source !== "manual",
  );

  function saveReview(review: Review) {
    const exists = reviews.some((other) => other.id === review.id);
    onChange({
      reviews: exists
        ? reviews.map((other) => (other.id === review.id ? review : other))
        : [...reviews, review],
    });
    setEditing(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <ToggleRow
        id="show-reviews"
        label="Show guest reviews on my website"
        description="Adds a reviews section with star ratings to your home page."
        checked={show}
        onChange={(showReviews) => onChange({ showReviews })}
      />
      {show ? (
        <>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-office-icon">
              Review source
            </legend>
            <div className="flex flex-wrap gap-2">
              {SOURCES.map((option) => {
                const on = option.value === source;
                return (
                  <label
                    key={option.value}
                    className={cn(
                      "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-4 text-sm transition-colors has-focus-visible:ring-2 has-focus-visible:ring-office-primary",
                      on
                        ? "border-brand-cyan bg-[#f8fcfd] font-semibold text-office-primary"
                        : "border-office-meter-track bg-card text-office-icon hover:border-brand-cyan/60",
                    )}
                  >
                    <input
                      type="radio"
                      name="review-source"
                      checked={on}
                      onChange={() => onChange({ reviewSource: option.value })}
                      className="sr-only"
                    />
                    {on ? (
                      <Check
                        aria-hidden="true"
                        className="size-4"
                        strokeWidth={2.5}
                      />
                    ) : null}
                    {option.label}
                  </label>
                );
              })}
            </div>
            {importing ? (
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-office-tint-blue px-4 py-3 text-sm text-office-ink-blue">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {importing.label} is not available yet. Add reviews manually for
                now; they stay on your website when importing is ready.
              </p>
            ) : null}
          </fieldset>

          <ul className="flex flex-col gap-3">
            {reviews.map((review) =>
              editing === review.id ? (
                <li key={review.id}>
                  <ReviewEditor
                    review={review}
                    onSave={saveReview}
                    onCancel={() => setEditing(null)}
                  />
                </li>
              ) : (
                <li
                  key={review.id}
                  className="flex gap-3 rounded-xl border border-office-meter-track bg-card p-4"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-office-tint-teal text-sm font-semibold text-office-primary"
                  >
                    {initials(review.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 text-sm">
                      <span className="font-semibold text-office-icon">
                        {review.name}
                      </span>
                      {review.country ? (
                        <span className="text-office-muted">
                          {review.country}
                        </span>
                      ) : null}
                      <Stars value={review.rating} />
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-office-icon">
                      “{review.text}”
                    </p>
                  </div>
                  <RowActions
                    name={`review by ${review.name}`}
                    onEdit={() => setEditing(review.id)}
                    onDelete={() =>
                      onChange({
                        reviews: reviews.filter(
                          (other) => other.id !== review.id,
                        ),
                      })
                    }
                  />
                </li>
              ),
            )}
          </ul>
          {editing === "new" ? (
            <ReviewEditor
              onSave={saveReview}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <AddButton onClick={() => setEditing("new")}>Add review</AddButton>
          )}
        </>
      ) : null}
    </div>
  );
}

function ReviewEditor({
  review,
  onSave,
  onCancel,
}: {
  review?: Review;
  onSave: (review: Review) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Review>(
    review ?? {
      id: crypto.randomUUID(),
      name: "",
      country: "",
      rating: 5,
      text: "",
    },
  );
  const [error, setError] = useState<string | null>(null);
  const id = (field: string) => `review-${values.id}-${field}`;

  function save() {
    if (!values.name.trim() || !values.text.trim()) {
      setError("Enter the guest's name and what they said.");
      return;
    }
    onSave({
      ...values,
      name: values.name.trim(),
      country: values.country.trim(),
      text: values.text.trim(),
    });
  }

  return (
    <EditorPanel
      error={error}
      saveLabel={review ? "Save review" : "Add review"}
      onSave={save}
      onCancel={onCancel}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={id("name")} label="Guest name" required>
          <input
            id={id("name")}
            value={values.name}
            onChange={(event) =>
              setValues({ ...values, name: event.target.value })
            }
            placeholder="Emma Wilson"
            className={inputClass}
          />
        </Field>
        <Field id={id("country")} label="Country" hint="Optional">
          <input
            id={id("country")}
            value={values.country}
            onChange={(event) =>
              setValues({ ...values, country: event.target.value })
            }
            placeholder="United Kingdom"
            className={inputClass}
          />
        </Field>
      </div>
      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-semibold text-office-icon">
          Rating
        </legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <label
              key={star}
              className="cursor-pointer rounded has-focus-visible:ring-2 has-focus-visible:ring-office-primary"
            >
              <input
                type="radio"
                name={id("rating")}
                checked={values.rating === star}
                onChange={() => setValues({ ...values, rating: star })}
                className="sr-only"
              />
              <span className="sr-only">{star} star</span>
              <Star
                aria-hidden="true"
                className={cn(
                  "size-6",
                  star <= values.rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-office-muted/50",
                )}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <Field
        id={id("text")}
        label="Review"
        hint={`${values.text.length} / ${REVIEW_MAX}`}
        required
        className="mt-4"
      >
        <textarea
          id={id("text")}
          rows={3}
          maxLength={REVIEW_MAX}
          value={values.text}
          onChange={(event) =>
            setValues({ ...values, text: event.target.value })
          }
          placeholder="Beautiful rooms and the friendliest hosts."
          className={cn(inputClass, "h-auto resize-y py-3 leading-relaxed")}
        />
      </Field>
    </EditorPanel>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          className={cn(
            "size-3.5",
            star <= value
              ? "fill-amber-400 text-amber-400"
              : "text-office-muted/40",
          )}
        />
      ))}
    </span>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
