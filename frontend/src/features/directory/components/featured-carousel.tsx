"use client";

import { useEffect, useState, type FocusEvent } from "react";
import { cn } from "@/lib/utils";
import type { FeaturedProperty } from "../types";
import { FeaturedPropertyCard } from "./featured-property-card";

const FIRST_MOVE_MS = 1000; // delay before the first move after load or a pause
const TRANSITION_MS = 1000; // length of each move
const REST_MS = 1000; // still time between moves

type Slot = "centre" | "left" | "right" | "hiddenLeft" | "hiddenRight";

// Cover-flow pose per slot. Only transforms, opacity and z-index change.
// z-index is transitioned too, so the incoming card passes in front of the
// outgoing one halfway through the move instead of popping on top at the start. Each slide has a dark backing so cards behind the
// see-through glass of the centre card don't show through it.
const SLOT_CLASS: Record<Slot, string> = {
  centre: "z-30 opacity-100",
  left: "z-20 -translate-x-[70%] -translate-z-24 rotate-y-35 scale-85 opacity-70",
  right: "z-20 translate-x-[70%] -translate-z-24 -rotate-y-35 scale-85 opacity-70",
  hiddenLeft: "z-10 -translate-x-[110%] -translate-z-48 rotate-y-35 scale-70 opacity-0",
  hiddenRight: "z-10 translate-x-[110%] -translate-z-48 -rotate-y-35 scale-70 opacity-0",
};

// Signed circular distance from the centre card, e.g. -1 = left neighbour.
function slotFor(index: number, active: number, count: number): Slot {
  let offset = (index - active + count) % count;
  if (offset > count / 2) offset -= count;
  if (offset === 0) return "centre";
  if (offset === -1) return "left";
  if (offset === 1) return "right";
  return offset < 0 ? "hiddenLeft" : "hiddenRight";
}

// Auto-playing 3D cover flow. Pauses on hover, keyboard focus and hidden tabs;
// never advances for reduced-motion users. Only the centre card is interactive.
export function FeaturedCarousel({ properties }: { properties: FeaturedProperty[] }) {
  const count = properties.length;
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;

  useEffect(() => {
    if (paused || count < 2) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const advance = () => {
      if (!document.hidden && !reducedMotion.matches) setActive((i) => (i + 1) % count);
    };
    let intervalId: number | undefined;
    const timeoutId = window.setTimeout(() => {
      advance();
      intervalId = window.setInterval(advance, TRANSITION_MS + REST_MS);
    }, FIRST_MOVE_MS);
    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [paused, count]);

  function handleBlur(event: FocusEvent<HTMLUListElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
  }

  return (
    // Negative margins let side cards peek to the screen edge on small screens.
    <div className="-mx-4 overflow-x-clip sm:-mx-6 lg:mx-0 lg:overflow-x-visible">
      <ul
        className="grid perspective-distant"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
      >
        {properties.map((property, index) => {
          const slot = slotFor(index, active, count);
          return (
            <li
              key={property.slug}
              inert={slot !== "centre"}
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${count}`}
              style={{ transitionDuration: `${TRANSITION_MS}ms` }}
              className={cn(
                "col-start-1 row-start-1 w-64 justify-self-center rounded-3xl bg-black/50 transition-[transform,translate,scale,opacity,z-index] ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none sm:w-72 xl:w-80 2xl:w-96",
                SLOT_CLASS[slot],
              )}
            >
              <FeaturedPropertyCard property={property} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
