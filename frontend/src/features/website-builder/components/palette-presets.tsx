"use client";

import { Check } from "lucide-react";
import { cn } from "cn";
import type { ColorKey, Palette } from "./brand-colors-form";

// Swatches read primary, secondary, background, accent, as in the design.
export const PALETTE_PRESETS: {
  name: string;
  colors: Palette;
  names: Record<ColorKey, string>;
}[] = [
  {
    name: "Coastal Teal",
    colors: {
      primary: "#0E5E52",
      secondary: "#0B2545",
      accent: "#F5A524",
      background: "#F7F7F4",
    },
    names: {
      primary: "Deep green",
      secondary: "Navy",
      accent: "Sun gold",
      background: "Sand",
    },
  },
  {
    name: "Sunset Coral",
    colors: {
      primary: "#C8603F",
      secondary: "#3D2C2E",
      accent: "#F2B880",
      background: "#FBF6F0",
    },
    names: {
      primary: "Coral",
      secondary: "Cocoa",
      accent: "Peach",
      background: "Cream",
    },
  },
  {
    name: "Forest Green",
    colors: {
      primary: "#2F5D3A",
      secondary: "#1E2B20",
      accent: "#C9A227",
      background: "#F4F1EA",
    },
    names: {
      primary: "Forest",
      secondary: "Charcoal",
      accent: "Mustard",
      background: "Linen",
    },
  },
  {
    name: "Classic Navy",
    colors: {
      primary: "#1F3A5F",
      secondary: "#0E1726",
      accent: "#C08A3E",
      background: "#F5F6F8",
    },
    names: {
      primary: "Navy",
      secondary: "Midnight",
      accent: "Bronze",
      background: "Mist",
    },
  },
];

// The preset matching these colors exactly (case-insensitive), if any.
export function findPreset(colors: Palette) {
  return PALETTE_PRESETS.find((option) =>
    (Object.keys(option.colors) as ColorKey[]).every(
      (key) => option.colors[key].toLowerCase() === colors[key]?.toLowerCase(),
    ),
  );
}

type PresetPickerProps = {
  legend: string;
  // Small text on the right of the legend.
  hint?: string;
  value: Palette;
  onChange: (colors: Palette) => void;
  className?: string;
};

// Four palette cards; picking one sets all four colors.
export function PresetPicker({
  legend,
  hint,
  value,
  onChange,
  className,
}: PresetPickerProps) {
  const preset = findPreset(value);
  return (
    <fieldset className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <legend className="text-sm font-semibold text-office-icon">
          {legend}
        </legend>
        {hint ? (
          <span className="text-xs text-office-muted">{hint}</span>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {PALETTE_PRESETS.map((option) => {
          const selected = option === preset;
          return (
            <label
              key={option.name}
              className={cn(
                "relative cursor-pointer rounded-xl border-[1.5px] bg-card p-2.5 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-office-primary",
                selected
                  ? "border-brand-cyan bg-[#f8fcfd]"
                  : "border-office-meter-track hover:border-brand-cyan/60",
              )}
            >
              <input
                type="radio"
                name="palette-preset"
                checked={selected}
                onChange={() => onChange(option.colors)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className="flex h-8 overflow-hidden rounded-md"
              >
                {[
                  option.colors.primary,
                  option.colors.secondary,
                  option.colors.background,
                  option.colors.accent,
                ].map((color) => (
                  <span
                    key={color}
                    className="flex-1"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </span>
              <span className="mt-2.5 block text-xs font-semibold text-office-icon">
                {option.name}
              </span>
              {selected ? (
                <span className="absolute right-2 bottom-2 flex size-5 items-center justify-center rounded-full bg-office-primary text-white">
                  <Check
                    aria-hidden="true"
                    className="size-3"
                    strokeWidth={3}
                  />
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
