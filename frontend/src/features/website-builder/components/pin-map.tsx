"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { MapPin } from "lucide-react";

// Pin position as a percentage of the map box (0–100 each way).
export type PinPosition = { x: number; y: number };

type PinMapProps = {
  label: string;
  pin: PinPosition;
  onChange: (pin: PinPosition) => void;
};

const clamp = (value: number) => Math.min(96, Math.max(4, value));

// Placeholder street map with a pin you drag (the map box handles the
// pointer, so pressing anywhere moves the pin there) or move with arrow keys.
// No map provider is connected yet, so the position is stored relative to
// this drawing and should be replaced with real coordinates when one is chosen.
export function PinMap({ label, pin, onChange }: PinMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  function moveTo(event: PointerEvent) {
    const box = mapRef.current?.getBoundingClientRect();
    if (!box) return;
    onChange({
      x: clamp(((event.clientX - box.left) / box.width) * 100),
      y: clamp(((event.clientY - box.top) / box.height) * 100),
    });
  }

  function handleKey(event: KeyboardEvent) {
    const step = event.shiftKey ? 10 : 2;
    const moves: Record<string, PinPosition> = {
      ArrowLeft: { x: pin.x - step, y: pin.y },
      ArrowRight: { x: pin.x + step, y: pin.y },
      ArrowUp: { x: pin.x, y: pin.y - step },
      ArrowDown: { x: pin.x, y: pin.y + step },
    };
    const next = moves[event.key];
    if (!next) return;
    event.preventDefault();
    onChange({ x: clamp(next.x), y: clamp(next.y) });
  }

  return (
    <div
      ref={mapRef}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        moveTo(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          moveTo(event);
      }}
      className="relative h-44 cursor-crosshair touch-none overflow-hidden rounded-xl border border-office-meter-track bg-[#e8f1ec] select-none sm:h-52"
    >
      {/* Blocks, roads and the sea, drawn to match the design. */}
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute inset-x-0 bottom-0 h-[26%] bg-[#cfe6ee]" />
        <div className="absolute inset-x-0 bottom-[26%] h-[12%] bg-[#eef3ef]" />
        <div className="absolute inset-x-0 top-[55%] h-2 bg-white" />
        <div className="absolute top-0 left-[33%] h-[59%] w-2 bg-white" />
        <div className="absolute top-0 left-[72%] h-[59%] w-2 bg-white" />
        <div className="absolute top-[18%] left-[9%] h-[18%] w-[16%] rounded bg-[#d7e8de]" />
        <div className="absolute top-[14%] left-[38%] h-[22%] w-[10%] rounded bg-[#d7e8de]" />
        <div className="absolute top-[18%] left-[77%] h-[18%] w-[13%] rounded bg-[#d7e8de]" />
      </div>
      <button
        type="button"
        aria-label={`Map pin for ${label}. Drag it, or use the arrow keys to move it.`}
        onKeyDown={handleKey}
        style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
        className="focus-ring absolute -translate-x-1/2 -translate-y-full cursor-grab rounded-full text-office-primary active:cursor-grabbing"
      >
        <MapPin
          aria-hidden="true"
          className="size-8 fill-office-primary stroke-white"
          strokeWidth={1.5}
        />
      </button>
      <span
        aria-hidden="true"
        style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
        className="pointer-events-none absolute ml-4 -translate-y-[160%] rounded-md bg-white px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-office-icon shadow"
      >
        {label}
      </span>
    </div>
  );
}
