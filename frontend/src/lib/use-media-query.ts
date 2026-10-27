"use client";

import { useSyncExternalStore } from "react";

// True while the CSS media query matches. `serverValue` is used for the
// server render and hydration, so pick the layout CSS shows by default.
export function useMediaQuery(query: string, serverValue: boolean) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
