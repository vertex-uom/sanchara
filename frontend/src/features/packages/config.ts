import type { ItemKind, PackageStatus, PackageTheme, PaymentMode, RoomAvailability } from "./types";
import type { ChipTone } from "@/components/ui/tone-chip";

export const PACKAGE_STATUSES: readonly PackageStatus[] = ["active", "draft"];
export const PACKAGE_THEMES: readonly PackageTheme[] = ["surf", "wellness", "hill-country", "general"];
export const ITEM_KINDS: readonly ItemKind[] = ["room", "meal", "transfer", "activity"];
export const PAYMENT_MODES: readonly PaymentMode[] = ["online", "property"];

export const STATUS_META: Record<PackageStatus, { label: string; tone: ChipTone }> = {
  active: { label: "Active", tone: "success" },
  draft: { label: "Draft", tone: "neutral" },
};

export const THEME_LABELS: Record<PackageTheme, string> = {
  surf: "Surf",
  wellness: "Wellness",
  "hill-country": "Hill country",
  general: "General",
};

export const ITEM_KIND_LABELS: Record<ItemKind, string> = {
  room: "Room",
  meal: "Meal",
  transfer: "Transfer",
  activity: "Activity",
};

export const PAYMENT_LABELS: Record<PaymentMode, string> = {
  online: "Paid online",
  property: "Pay at property",
};

export const AVAILABILITY_META: Record<RoomAvailability, { label: string; tone: ChipTone }> = {
  available: { label: "Available", tone: "success" },
  limited: { label: "Limited", tone: "info" },
  unavailable: { label: "Unavailable", tone: "danger" },
};

// TODO(confirm): v8 has not set package limits; these keep the editor usable.
export const PACKAGE_LIMITS = {
  name: 80,
  tagline: 140,
  dayTitle: 40,
  dayNote: 60,
  itemName: 60,
  itemDescription: 100,
  nights: 30,
  days: 14,
  itemsPerDay: 10,
  // Whole rupees.
  maxPrice: 10_000_000,
} as const;

export const PACKAGE_ERROR_MESSAGES = {
  NOT_FOUND: "That package no longer exists.",
  STALE: "This package was changed somewhere else. Reload the page to see the latest version.",
  FAILED: "Something went wrong. Try again.",
} as const;

export type PackageErrorCode = keyof typeof PACKAGE_ERROR_MESSAGES;
