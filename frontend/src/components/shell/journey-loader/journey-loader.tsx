"use client";

import { useEffect, useEffectEvent, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Logo } from "../logo";
import "./journey-loader.css";

const STORAGE_KEY = "sanchara:journey-seen";
// Route from the hills marker to the coast marker, in the 320×120 route box.
// Shared by the SVG line and the pin's CSS offset-path so they stay in sync.
const ROUTE = "M30 74C100 18 190 112 290 54";
const REDUCED_MOTION_MIN_MS = 600;
const EXIT_FALLBACK_MS = 1200;

// Fallback when sessionStorage is blocked: never replay within one page lifetime.
let playedInDocument = false;

function hasSeen() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Storage blocked; playedInDocument covers client-side navigations.
  }
}

const SKIP_STYLE_ID = "journey-loader-skip";

declare global {
  interface Window {
    __sancharaJourney?: { state: "play" | "skip"; start: number };
  }
}

// Runs while the HTML is parsed, before the overlay exists and before first
// paint. Records play or skip for the client, and on skip hides the overlay
// with a <head> style so returning visitors never see it flash. It leaves
// <html> alone because React owns its attributes.
const PRE_PAINT_SCRIPT = `(function(){var s="play";try{if(sessionStorage.getItem(${JSON.stringify(STORAGE_KEY)})!==null)s="skip";else sessionStorage.setItem(${JSON.stringify(STORAGE_KEY)},"1")}catch(e){}window.__sancharaJourney={state:s,start:performance.now()};if(s==="skip"){var st=document.createElement("style");st.id=${JSON.stringify(SKIP_STYLE_ID)};st.textContent="[data-journey-loader]{display:none}";document.head.appendChild(st)}})()`;

type JourneyLoaderProps = {
  label?: string;
  minDurationMs?: number;
  maxDurationMs?: number;
  // The loader ends once this image has loaded (clamped to min/max).
  heroSelector?: string;
  onComplete?: () => void;
};

// Branded first-visit splash: a dotted route draws from the hills to the coast
// while a pin follows it, then the overlay lifts away. Once per browser session.
export function JourneyLoader({
  label = "Finding your stay...",
  minDurationMs = 1200,
  maxDurationMs = 2500,
  heroSelector = "[data-hero-image]",
  onComplete,
}: JourneyLoaderProps) {
  const maskId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const complete = useEffectEvent(() => onComplete?.());

  useLayoutEffect(() => {
    const root = rootRef.current;
    const sheet = sheetRef.current;
    if (!root || !sheet) return;

    // Hard loads: adopt the pre-paint script's decision. Client-side navigations: decide here.
    if (!root.dataset.state) {
      const decided = window.__sancharaJourney;
      delete window.__sancharaJourney;
      root.dataset.start = String(decided?.start ?? performance.now());
      root.dataset.state = decided?.state ?? (playedInDocument || hasSeen() ? "skip" : "play");
      if (!decided && root.dataset.state === "play") markSeen();
      document.getElementById(SKIP_STYLE_ID)?.remove();
    }
    if (root.dataset.state === "skip") {
      setDone(true);
      return;
    }
    playedInDocument = true;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = Number(root.dataset.start) || performance.now();
    const minEnd = start + (reducedMotion ? Math.min(minDurationMs, REDUCED_MOTION_MIN_MS) : minDurationMs);
    const maxEnd = start + Math.max(minDurationMs, maxDurationMs);
    const timers: number[] = [];
    const at = (time: number, fn: () => void) =>
      timers.push(window.setTimeout(fn, Math.max(0, time - performance.now())));

    const finish = () => setDone(true);
    const onSheetTransitionEnd = (event: TransitionEvent) => {
      if (event.target === sheet && event.propertyName === "opacity") finish();
    };
    let exiting = false;
    const exit = () => {
      if (exiting) return;
      exiting = true;
      root.dataset.state = "exit";
      root.setAttribute("aria-hidden", "true");
      sheet.addEventListener("transitionend", onSheetTransitionEnd);
      at(performance.now() + EXIT_FALLBACK_MS, finish);
    };

    at(maxEnd, exit);
    const onHeroReady = () => at(minEnd, exit);
    const hero = heroSelector ? document.querySelector<HTMLImageElement>(heroSelector) : null;
    if (!hero || hero.complete) {
      onHeroReady();
    } else {
      hero.addEventListener("load", onHeroReady, { once: true });
      hero.addEventListener("error", onHeroReady, { once: true });
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      hero?.removeEventListener("load", onHeroReady);
      hero?.removeEventListener("error", onHeroReady);
      sheet.removeEventListener("transitionend", onSheetTransitionEnd);
    };
  }, [heroSelector, minDurationMs, maxDurationMs]);

  useEffect(() => {
    if (done) complete();
  }, [done]);

  if (done) return null;

  const vars = {
    "--journey-route": `path("${ROUTE}")`,
    "--journey-draw": `${Math.max(400, minDurationMs - 150)}ms`,
    "--journey-max": `${Math.max(minDurationMs, maxDurationMs)}ms`,
  } as CSSProperties;

  return (
    <>
      <script
        // Inert on the client (client-side navigations are handled in the layout effect).
        type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: PRE_PAINT_SCRIPT }}
      />
      <noscript>
        <style>{"[data-journey-loader]{display:none!important}"}</style>
      </noscript>
      <div
        ref={rootRef}
        data-journey-loader=""
        role="status"
        aria-live="polite"
        style={vars}
        className="journey-loader fixed inset-0 z-50 overflow-hidden"
      >
        <div
          ref={sheetRef}
          className="journey-loader__sheet absolute inset-0 flex flex-col items-center justify-center gap-6 bg-brand-tropical bg-linear-to-br from-transparent to-black/70 px-4 text-brand-cream"
        >
          <div aria-hidden="true" className="journey-loader__logo">
            <Logo />
          </div>

          <div aria-hidden="true" className="journey-loader__route relative h-[120px] w-[320px] md:my-4 md:scale-125 lg:my-8 lg:scale-150">
            <svg viewBox="0 0 320 120" width="320" height="120" className="absolute inset-0">
              <defs>
                <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="320" height="120">
                  <path d={ROUTE} pathLength={1} fill="none" stroke="white" strokeWidth="12" className="journey-loader__draw" />
                </mask>
              </defs>
              {/* Hills marker */}
              <g className="journey-loader__marker">
                <path d="M12 94 22 80l6 7 8-12 12 19Z" className="fill-brand-lagoon/80" />
              </g>
              {/* Coast marker: two waves */}
              <g className="journey-loader__marker journey-loader__marker--end" fill="none" strokeLinecap="round" strokeWidth="2.5">
                <path d="M274 70q4-4 8 0t8 0 8 0" className="stroke-brand-lagoon" />
                <path d="M278 78q4-4 8 0t8 0" className="stroke-brand-lagoon/70" />
              </g>
              <path
                d={ROUTE}
                mask={`url(#${maskId})`}
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="0 9"
                className="stroke-brand-aqua"
              />
            </svg>
            <span className="journey-loader__pin">
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path d="M12 23s8-7.4 8-13.5a8 8 0 1 0-16 0C4 15.6 12 23 12 23Z" className="fill-brand-blaze" />
                <circle cx="12" cy="9.5" r="3" className="fill-brand-cream" />
              </svg>
            </span>
          </div>

          <p className="journey-loader__label text-base font-medium tracking-wide text-brand-aqua">{label}</p>
        </div>
      </div>
    </>
  );
}
