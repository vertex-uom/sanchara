"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

// Other tabs saving the same draft.
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
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
  const storageKey = `sanchara:website-template:${key}`;
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

  function save() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(values));
      setEdits(null);
    } catch {
      // Keep the edits on screen; the status stays "Unsaved changes".
    }
  }

  return { values, update, save, saved: edits === null && stored !== null };
}
