"use client";

import { useSyncExternalStore } from "react";

// Photos picked in the template steps. Files cannot go in the localStorage
// draft, so they live in this module: they survive moving between steps (and
// reach the review page) but not a full page reload. Replace with real
// uploads when the builder API exists.
const store = new Map<string, unknown>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTemplateFiles<T>(key: string, empty: T) {
  const value = useSyncExternalStore(
    subscribe,
    () => (store.has(key) ? (store.get(key) as T) : empty),
    () => empty,
  );

  function set(next: T | ((current: T) => T)) {
    const current = store.has(key) ? (store.get(key) as T) : empty;
    store.set(
      key,
      typeof next === "function" ? (next as (current: T) => T)(current) : next,
    );
    listeners.forEach((listener) => listener());
  }

  return [value, set] as const;
}

// Keys shared by the step forms and the review page.
export const FILE_KEYS = {
  hotelImages: "hotel-images",
  roomPhotos: "room-photos",
  gallery: "gallery",
  scratchLogo: "scratch-logo",
  // Photos in builder blocks, by block id.
  scratchBlockImages: "scratch-block-images",
  // Media Library: photos uploaded to it, and alt text by photo id.
  mediaUploads: "media-uploads",
  mediaAlt: "media-alt",
  // Photos and logo attached to the WEMIXT assistance request.
  assistanceFiles: "assistance-files",
} as const;

export type HotelImages = {
  logo: File | null;
  cover: File | null;
  about: File | null;
};

// Stable empty values, so the store snapshot does not change every render.
export const NO_HOTEL_IMAGES: HotelImages = {
  logo: null,
  cover: null,
  about: null,
};
export const NO_ROOM_PHOTOS: Record<string, File[]> = {};
export const NO_GALLERY: File[] = [];
