"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { AmenityGrid } from "./amenity-grid";
import { GuestReviews, type Review, type ReviewSource } from "./guest-reviews";
import { NearbyAttractions, type Attraction } from "./nearby-attractions";
import { GALLERY_RECOMMENDED, PhotoGallery } from "./photo-gallery";
import { useTemplateDraft } from "./template-draft";
import { formCardClass } from "./template-fields";
import { TemplateProgress } from "./template-progress";

const FORM_PATH = `${COMPANY_PATHS.website}/template-form`;

const AMENITIES = [
  "Free Wi-Fi",
  "Swimming pool",
  "Free parking",
  "Restaurant",
  "Air conditioning",
  "Room service",
  "Airport shuttle",
  "24-hour front desk",
  "Garden",
  "Spa & wellness",
  "Fitness centre",
  "Bar",
  "Laundry service",
  "Kids play area",
  "EV charging",
];

type FacilitiesPhotos = {
  amenities: string[];
  customAmenities: string[];
  showReviews: boolean;
  reviewSource: ReviewSource;
  reviews: Review[];
  attractions: Attraction[];
};

// Step 4 of the hotel template form. Gallery photos are optional and kept in
// memory only.
export function FacilitiesPhotosForm() {
  const router = useRouter();
  const { values, update, save, saved } = useTemplateDraft<FacilitiesPhotos>(
    "facilities-photos",
    {
      amenities: [],
      customAmenities: [],
      showReviews: true,
      reviewSource: "manual",
      reviews: [],
      attractions: [],
    },
  );
  const [gallery, setGallery] = useState<File[]>([]);

  function toggleAmenity(amenity: string) {
    update({
      amenities: values.amenities.includes(amenity)
        ? values.amenities.filter((item) => item !== amenity)
        : [...values.amenities, amenity],
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save();
    router.push(`${FORM_PATH}/policies`);
  }

  const selectedCount = values.amenities.length;

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <form
        id="facilities-photos-form"
        onSubmit={handleSubmit}
        className="flex min-w-0 flex-1 flex-col gap-5"
      >
        <section aria-labelledby="amenities-title" className={formCardClass}>
          <h2
            id="amenities-title"
            className="text-lg font-semibold text-office-icon"
          >
            Amenities &amp; facilities
          </h2>
          <p className="mt-1 text-sm text-office-muted">
            Tick everything your property offers. {selectedCount} selected.
          </p>
          <div className="mt-5">
            <AmenityGrid
              options={[...AMENITIES, ...values.customAmenities]}
              selected={values.amenities}
              onToggle={toggleAmenity}
              onAdd={(amenity) =>
                update({
                  customAmenities: [...values.customAmenities, amenity],
                  amenities: [...values.amenities, amenity],
                })
              }
            />
          </div>
        </section>

        <section aria-labelledby="gallery-title" className={formCardClass}>
          <h2
            id="gallery-title"
            className="text-lg font-semibold text-office-icon"
          >
            Photo gallery
          </h2>
          <p className="mt-1 text-sm text-office-muted">
            Optional. We recommend at least {GALLERY_RECOMMENDED} photos. Drag
            to reorder — the first photo is used as the cover.
          </p>
          <div className="mt-5">
            <PhotoGallery photos={gallery} onChange={setGallery} />
          </div>
        </section>

        <section aria-labelledby="reviews-title" className={formCardClass}>
          <h2
            id="reviews-title"
            className="text-lg font-semibold text-office-icon"
          >
            Guest reviews
          </h2>
          <p className="mt-1 text-sm text-office-muted">
            Show what guests say about your stay.
          </p>
          <div className="mt-5">
            <GuestReviews
              show={values.showReviews}
              source={values.reviewSource}
              reviews={values.reviews}
              onChange={update}
            />
          </div>
        </section>

        <section aria-labelledby="attractions-title" className={formCardClass}>
          <h2
            id="attractions-title"
            className="text-lg font-semibold text-office-icon"
          >
            Nearby attractions
          </h2>
          <p className="mt-1 text-sm text-office-muted">
            Optional. Help guests plan their stay.
          </p>
          <div className="mt-5">
            <NearbyAttractions
              attractions={values.attractions}
              onChange={(attractions) => update({ attractions })}
            />
          </div>
        </section>
      </form>

      <TemplateProgress
        formStep={4}
        note="Your photos appear in the Gallery section in the order shown here. Selected amenities are shown with icons on the home page."
        formId="facilities-photos-form"
        backHref={`${FORM_PATH}/rooms`}
        onSaveDraft={save}
        saved={saved}
      />
    </div>
  );
}
