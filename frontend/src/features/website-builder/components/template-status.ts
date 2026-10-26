"use client";

import { HEX, type Palette } from "./brand-colors-form";
import type { ContactSocial } from "./contact-social-form";
import type { FacilitiesPhotos } from "./facilities-photos-form";
import type { HotelDetails } from "./hotel-details-form";
import type { PoliciesBooking } from "./policies-booking-form";
import { isRoomComplete } from "./room-category";
import type { RoomsPrices } from "./rooms-prices-form";
import { DRAFT_KEYS, useLastSaved, useSavedDraft } from "./template-draft";
import {
  FILE_KEYS,
  NO_GALLERY,
  NO_HOTEL_IMAGES,
  NO_ROOM_PHOTOS,
  useTemplateFiles,
} from "./template-files";
import { FORM_STEP_COUNT } from "./template-steps";
import { WEBSITE_PAGES } from "./website-pages";

export type Status = "complete" | "incomplete" | "not-started";

export type StepCheck = {
  // Index into TEMPLATE_STEPS (form step n is index n).
  step: number;
  status: Status;
  // What is missing, when incomplete.
  note?: string;
};

export const COLOR_LABELS: { key: keyof Palette; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "accent", label: "Accent" },
  { key: "background", label: "Background" },
];

// Pages the Contact step starts with, for a draft that was never saved.
const DEFAULT_PAGES = ["Gallery", "Reviews", "Contact"];

// Every saved template answer plus whether each step has what publishing
// needs. Shared by the review and publish pages so they agree on "ready".
export function useTemplateStatus() {
  const hotel = useSavedDraft<HotelDetails>(DRAFT_KEYS.hotel);
  const brand = useSavedDraft<Palette>(DRAFT_KEYS.brand);
  const rooms = useSavedDraft<RoomsPrices>(DRAFT_KEYS.rooms);
  const facilities = useSavedDraft<FacilitiesPhotos>(DRAFT_KEYS.facilities);
  const policies = useSavedDraft<PoliciesBooking>(DRAFT_KEYS.policies);
  const contact = useSavedDraft<ContactSocial>(DRAFT_KEYS.contact);
  const [images] = useTemplateFiles(FILE_KEYS.hotelImages, NO_HOTEL_IMAGES);
  const [roomPhotos] = useTemplateFiles(FILE_KEYS.roomPhotos, NO_ROOM_PHOTOS);
  const [gallery] = useTemplateFiles(FILE_KEYS.gallery, NO_GALLERY);
  const lastSaved = useLastSaved();

  const checks: StepCheck[] = [
    check(1, hotel, (draft) =>
      !filled(
        draft.name,
        draft.type,
        draft.tagline,
        draft.description,
        draft.story,
      )
        ? "Add the required hotel details."
        : !images.logo || !images.cover
          ? "Add your logo and cover photo (photos are not kept after a page reload yet)."
          : null,
    ),
    check(2, brand, (draft) =>
      COLOR_LABELS.every(({ key }) => HEX.test(draft[key] ?? ""))
        ? null
        : "Choose all four colors.",
    ),
    check(3, rooms, (draft) =>
      !draft.rooms?.length
        ? "Add at least one room category."
        : draft.rooms.every(isRoomComplete)
          ? null
          : "Finish every room category.",
    ),
    check(4, facilities, () => null),
    check(5, policies, (draft) =>
      !filled(draft.alertEmail)
        ? "Add an email for booking alerts."
        : draft.bookingMode !== "contact" &&
            (!draft.deposit || !draft.payments?.length)
          ? "Choose a deposit and at least one payment method."
          : null,
    ),
    check(6, contact, (draft) =>
      filled(draft.street, draft.city, draft.country, draft.phone, draft.email)
        ? null
        : "Add your address, phone number and email.",
    ),
  ];
  const done = checks.filter((item) => item.status === "complete").length;
  const enabled = contact?.pages ?? DEFAULT_PAGES;
  const menuPages = WEBSITE_PAGES.filter(
    (page) => page.required || enabled.includes(page.name),
  ).map((page) => page.name);

  return {
    hotel,
    brand,
    rooms,
    facilities,
    policies,
    contact,
    images,
    roomPhotos,
    gallery,
    lastSaved,
    checks,
    done,
    ready: done === FORM_STEP_COUNT,
    menuPages,
  };
}

function check<T>(
  step: number,
  draft: Partial<T> | null,
  problem: (draft: Partial<T>) => string | null,
): StepCheck {
  if (!draft) return { step, status: "not-started", note: "Not started yet." };
  const note = problem(draft);
  return note
    ? { step, status: "incomplete", note }
    : { step, status: "complete" };
}

function filled(...values: (string | undefined)[]) {
  return values.every((value) => Boolean(value?.trim()));
}

export function timeAgo(date: Date) {
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60)
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)} h ago`;
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}
