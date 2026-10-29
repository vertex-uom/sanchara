"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { IslandScene } from "./island-scene";
import { MAP_HEIGHT, MAP_WIDTH, OUTLINE_SVG_PATH, toMap, toPercent } from "./island-shape";

export type MapDestination = {
  name: string;
  region: string;
  href: string;
  position: { lat: number; lng: number };
};

type IslandMapProps = {
  // Must be stable between renders: the scene is rebuilt when it changes.
  destinations: MapDestination[];
  // Pin the camera flies to; null shows the whole island.
  focusIndex?: number | null;
  // When set, a plain click on another destination's label selects it
  // (the camera flies there) instead of following the link.
  onSelect?: (index: number) => void;
  sizeClassName?: string;
  className?: string;
};

// 3D Sri Lanka with a pin per destination. A flat SVG island renders first
// (and stays without WebGL or JavaScript); the three.js scene loads lazily
// and fades in over it. Labels are real links, placed over the pins.
export function IslandMap({
  destinations,
  focusIndex = null,
  onSelect,
  sizeClassName = "h-88 sm:h-104 lg:h-136",
  className,
}: IslandMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<IslandScene | null>(null);
  // Latest focus, so a scene that finishes loading later starts on it.
  const focusRef = useRef(focusIndex);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    focusRef.current = focusIndex;
    sceneRef.current?.focus(focusIndex);
  }, [focusIndex]);

  useEffect(() => {
    const container = containerRef.current;
    const frame = frameRef.current;
    if (!container || !frame) return;

    let cancelled = false;
    const labels = Array.from(frame.querySelectorAll<HTMLElement>("[data-island-label]"));
    // The scene moves labels inline; put React's % positions back on cleanup.
    const initialStyles = labels.map((label) => label.getAttribute("style") ?? "");
    import("./island-scene")
      .then(({ mountIslandScene }) => {
        if (cancelled) return;
        sceneRef.current = mountIslandScene({
          container,
          labelFrame: frame,
          pins: destinations.map(({ position }, index) => ({ ...toMap(position.lng, position.lat), label: labels[index] })),
          reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          onReady: () => setReady(true),
        });
        sceneRef.current?.focus(focusRef.current);
      })
      .catch(() => {
        // Chunk failed to load: the SVG island stays.
      });

    return () => {
      cancelled = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
      labels.forEach((label, index) => label.setAttribute("style", initialStyles[index]));
    };
  }, [destinations]);

  return (
    <div ref={containerRef} className={cn("relative", sizeClassName, className)}>
      {/* Same aspect as the island, so % positions match the SVG. */}
      <div
        ref={frameRef}
        className="absolute inset-y-8 left-1/2 z-10 -translate-x-1/2"
        style={{ aspectRatio: `${MAP_WIDTH} / ${MAP_HEIGHT}` }}
      >
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className={cn("size-full transition-opacity duration-700 motion-reduce:transition-none", ready && "opacity-0")}
        >
          <path d={OUTLINE_SVG_PATH} className="fill-brand-teal/80 stroke-brand-aqua/60" strokeWidth="0.015" />
          {destinations.map(({ name, position }) => {
            const { x, y } = toMap(position.lng, position.lat);
            return <circle key={name} cx={x + MAP_WIDTH / 2} cy={MAP_HEIGHT / 2 - y} r="0.06" className="fill-brand-blaze" />;
          })}
        </svg>

        <ul aria-label="Featured destinations on a map of Sri Lanka">
          {destinations.map(({ name, region, href, position }, index) => {
            const point = toMap(position.lng, position.lat);
            const { left, top } = toPercent(point.x, point.y);
            return (
              <li
                key={name}
                data-island-label=""
                className={cn(
                  "group/label absolute -translate-x-1/2 -translate-y-[calc(100%+0.75rem)]",
                  // Set by the scene when labels would overlap: beside the pin instead.
                  "data-[side=left]:-translate-x-[calc(100%+0.75rem)] data-[side=left]:-translate-y-1/2",
                  "data-[side=right]:translate-x-3 data-[side=right]:-translate-y-1/2",
                )}
                style={{ left: `${left}%`, top: `${top}%` }}
              >
                <Link
                  href={href}
                  aria-current={index === focusIndex ? "location" : undefined}
                  onClick={(event) => {
                    if (!onSelect || index === focusIndex || event.button !== 0) return;
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                    event.preventDefault();
                    onSelect(index);
                  }}
                  className="focus-ring glass flex min-h-11 flex-col justify-center rounded-2xl bg-black/35 px-3 py-1 text-white shadow-lg transition-colors group-data-focused/label:bg-white group-data-focused/label:text-brand-tropical group-data-hover/label:bg-white group-data-hover/label:text-brand-tropical hover:bg-white hover:text-brand-tropical motion-reduce:transition-none"
                >
                  <span className="text-sm leading-tight font-semibold whitespace-nowrap">
                    <span className="sr-only">Browse stays in </span>
                    {name}
                  </span>
                  <span className="text-[0.7rem] leading-tight whitespace-nowrap opacity-80">{region}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
