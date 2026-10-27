"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

const PREFIX = "sanchara:website-template:";
const SAVED_AT_KEY = `${PREFIX}saved-at`;
// Fired on this tab after a save; "storage" only reaches other tabs.
const SAVED_EVENT = "sanchara:website-template-saved";

// Draft keys for each step, shared by the forms and the review page.
export const DRAFT_KEYS = {
  hotel: "hotel-details",
  brand: "brand-colors",
  rooms: "rooms-prices",
  facilities: "facilities-photos",
  policies: "policies-booking",
  contact: "contact-social",
  publish: "publish-settings",
  // "Start from scratch" flow.
  scratch: "scratch-basics",
  scratchSite: "scratch-site",
  // "Request WEMIXT assistance" form.
  assistance: "assistance-request",
} as const;

// Steps whose content is on the published template site.
const TEMPLATE_CONTENT_KEYS: string[] = [
  DRAFT_KEYS.hotel,
  DRAFT_KEYS.brand,
  DRAFT_KEYS.rooms,
  DRAFT_KEYS.facilities,
  DRAFT_KEYS.policies,
  DRAFT_KEYS.contact,
];

// Saves from this tab and from other tabs.
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(SAVED_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SAVED_EVENT, onChange);
  };
}

function readStorage(storageKey: string) {
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    // No storage (private window, blocked site data): no draft.
    return null;
  }
}

function parseDraft(stored: string | null) {
  if (!stored) return {};
  try {
    return JSON.parse(stored) as object;
  } catch {
    return {};
  }
}

// Answers for one template step, kept in this browser until the builder API
// exists. Returns the values, a field setter, a save function and whether the
// values on screen are the saved ones.
export function useTemplateDraft<T extends object>(key: string, initial: T) {
  const storageKey = `${PREFIX}${key}`;
  const stored = useSyncExternalStore(
    subscribe,
    () => readStorage(storageKey),
    () => null,
  );
  const draft = useMemo(() => parseDraft(stored), [stored]);
  // Changes since the last save; null when the screen matches the draft.
  const [edits, setEdits] = useState<Partial<T> | null>(null);
  const values = { ...initial, ...draft, ...edits } as T;

  function update(patch: Partial<T>) {
    setEdits((current) => ({ ...current, ...patch }));
  }

  // A patch is saved together with the edits (for a value set on submit).
  function save(patch?: Partial<T>) {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ ...values, ...patch }),
      );
      // Each draft remembers when it was saved (publish settings are not
      // content); "last saved" for the template counts template steps only.
      const now = new Date().toISOString();
      if (key !== DRAFT_KEYS.publish) {
        window.localStorage.setItem(`${SAVED_AT_KEY}:${key}`, now);
      }
      if (TEMPLATE_CONTENT_KEYS.includes(key)) {
        window.localStorage.setItem(SAVED_AT_KEY, now);
      }
      setEdits(null);
      window.dispatchEvent(new Event(SAVED_EVENT));
    } catch {
      // Keep the edits on screen; the status stays "Unsaved changes".
    }
  }

  return { values, update, save, saved: edits === null && stored !== null };
}

// A step's saved answers, read-only (review page); null if never saved.
export function useSavedDraft<T extends object>(
  key: string,
): Partial<T> | null {
  const stored = useSyncExternalStore(
    subscribe,
    () => readStorage(`${PREFIX}${key}`),
    () => null,
  );
  return useMemo(
    () => (stored ? (parseDraft(stored) as Partial<T>) : null),
    [stored],
  );
}

// When any step was last saved; null if never.
export function useLastSaved() {
  const stored = useSyncExternalStore(
    subscribe,
    () => readStorage(SAVED_AT_KEY),
    () => null,
  );
  return stored ? new Date(stored) : null;
}

// When one step was last saved; null if never (or saved before this was tracked).
export function useStepSavedAt(key: string) {
  const stored = useSyncExternalStore(
    subscribe,
    () => readStorage(`${SAVED_AT_KEY}:${key}`),
    () => null,
  );
  return stored ? new Date(stored) : null;
}
