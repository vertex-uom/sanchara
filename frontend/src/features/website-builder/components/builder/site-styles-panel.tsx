"use client";

import { useId } from "react";
import { Check, ChevronDown, Pencil, X } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { HEX } from "../brand-colors-form";
import { PALETTE_PRESETS } from "../palette-presets";
import type { Builder } from "./builder-state";
import {
  BODY_FONTS,
  BUTTON_SHAPES,
  COLOR_ROWS,
  HEADING_FONTS,
  isSameStyles,
  RADIUS_MAX,
  SITE_FONTS,
  TEXT_SIZE,
  type SiteStyles,
} from "./site-styles";

type SiteStylesPanelProps = {
  builder: Builder;
  // Styles saved with the site (or the Site basics defaults).
  saved: SiteStyles;
};

// Right panel for site-wide styles. Changes preview on the canvas straight
// away; "Apply to site" keeps them and "Reset" drops them.
export function SiteStylesPanel({ builder, saved }: SiteStylesPanelProps) {
  const styles = builder.styleDraft ?? saved;
  const changed = !isSameStyles(styles, saved);
  const update = (patch: Partial<SiteStyles>) =>
    builder.setStyleDraft({ ...styles, ...patch });
  const setColor = (key: keyof SiteStyles["colors"], value: string) =>
    update({ colors: { ...styles.colors, [key]: value.toUpperCase() } });

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-office-icon">
            Site Styles
          </h2>
          <p className="text-xs text-office-muted">
            Changes apply to every page and block.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close site styles"
          onClick={() => {
            builder.setStyleDraft(null);
            builder.select(null);
          }}
          className="focus-ring inline-flex size-8 items-center justify-center rounded-md text-office-icon hover:bg-office-chip"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-office-icon">
          Theme presets
        </legend>
        <div className="grid grid-cols-4 gap-2">
          {PALETTE_PRESETS.map((preset) => {
            const active =
              styles.colors.primary.toLowerCase() ===
                preset.colors.primary.toLowerCase() &&
              styles.colors.secondary.toLowerCase() ===
                preset.colors.secondary.toLowerCase() &&
              styles.colors.accent.toLowerCase() ===
                preset.colors.accent.toLowerCase() &&
              styles.colors.surface.toLowerCase() ===
                preset.colors.background.toLowerCase();
            return (
              <button
                key={preset.name}
                type="button"
                aria-pressed={active}
                aria-label={preset.name}
                title={preset.name}
                onClick={() =>
                  update({
                    colors: {
                      ...styles.colors,
                      primary: preset.colors.primary,
                      secondary: preset.colors.secondary,
                      accent: preset.colors.accent,
                      surface: preset.colors.background,
                    },
                  })
                }
                className={cn(
                  "focus-ring rounded-lg border-[1.5px] p-1",
                  active
                    ? "border-brand-cyan bg-[#f4fbfc]"
                    : "border-office-meter-track hover:border-brand-cyan/60",
                )}
              >
                <span
                  aria-hidden="true"
                  className="flex h-6 overflow-hidden rounded-[5px]"
                >
                  {[
                    preset.colors.primary,
                    preset.colors.secondary,
                    preset.colors.accent,
                  ].map((color) => (
                    <span
                      key={color}
                      className="flex-1"
                      style={{ background: color }}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-office-icon">
          Colors
        </legend>
        <ul className="flex flex-col gap-2">
          {COLOR_ROWS.map(({ key, label }) => (
            <li key={key}>
              <ColorRow
                label={label}
                value={styles.colors[key]}
                onChange={(value) => setColor(key, value)}
              />
            </li>
          ))}
        </ul>
      </fieldset>

      <FontSelect
        label="Heading font"
        options={HEADING_FONTS}
        value={styles.headingFont}
        onChange={(headingFont) => update({ headingFont })}
      />
      <FontSelect
        label="Body font"
        options={BODY_FONTS}
        value={styles.bodyFont}
        onChange={(bodyFont) => update({ bodyFont })}
      />

      <Slider
        label="Base text size"
        value={styles.textSize}
        min={TEXT_SIZE.min}
        max={TEXT_SIZE.max}
        onChange={(textSize) => update({ textSize })}
      />

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-office-icon">
          Button shape
        </legend>
        <div className="grid grid-cols-3 rounded-lg border border-office-meter-track p-1">
          {BUTTON_SHAPES.map((shape) => (
            <button
              key={shape}
              type="button"
              aria-pressed={styles.buttonShape === shape}
              onClick={() => update({ buttonShape: shape })}
              className={cn(
                "focus-ring h-8 rounded-md text-xs font-medium",
                styles.buttonShape === shape
                  ? "bg-office-primary text-white"
                  : "text-office-icon hover:bg-office-chip",
              )}
            >
              {shape}
            </button>
          ))}
        </div>
        {/* Preview in the site's own colors and button shape. */}
        <div
          aria-hidden="true"
          className="mt-3 flex justify-center gap-2.5 rounded-xl bg-office-chip/60 p-3"
          style={{ fontFamily: SITE_FONTS[styles.bodyFont]?.family }}
        >
          {[true, false].map((filled) => (
            <span
              key={String(filled)}
              className="inline-flex h-9 items-center border-[1.5px] px-4 text-xs font-semibold"
              style={{
                borderRadius:
                  styles.buttonShape === "Pill"
                    ? 999
                    : styles.buttonShape === "Square"
                      ? 2
                      : 8,
                borderColor: styles.colors.primary,
                background: filled ? styles.colors.primary : "#ffffff",
                color: filled ? "#ffffff" : styles.colors.primary,
              }}
            >
              {filled ? "Book Now" : "Learn More"}
            </span>
          ))}
        </div>
      </fieldset>

      <Slider
        label="Corner radius"
        value={styles.radius}
        min={0}
        max={RADIUS_MAX}
        onChange={(radius) => update({ radius })}
      />

      <div className="flex flex-col gap-2 border-t border-office-meter-track pt-5">
        <p role="status" className="text-xs text-office-muted">
          {changed
            ? "Previewing on the canvas. Apply to keep these styles."
            : "These are your site styles."}
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            type="button"
            variant="outline"
            disabled={!changed}
            onClick={() => builder.setStyleDraft(null)}
            className="h-11 border-office-meter-track bg-card font-semibold text-office-icon hover:bg-office-chip"
          >
            Reset
          </Button>
          <Button
            type="button"
            variant="office"
            disabled={!changed}
            onClick={() => builder.applyStyles(styles)}
            className="h-11 gap-2 font-semibold"
          >
            <Check aria-hidden="true" className="size-4" />
            Apply to site
          </Button>
        </div>
      </div>
    </div>
  );
}

// A color: swatch, name and hex; the pencil (or the row) opens the picker.
function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3 rounded-xl border border-office-meter-track px-3 py-2.5 has-focus-visible:ring-2 has-focus-visible:ring-office-primary hover:bg-office-chip/40"
    >
      <span
        aria-hidden="true"
        className="size-7 shrink-0 rounded-md border border-black/10"
        style={{ background: value }}
      />
      <span className="flex-1 text-sm font-medium text-office-icon">
        {label}
      </span>
      <span className="text-xs text-office-muted uppercase">{value}</span>
      <Pencil aria-hidden="true" className="size-3.5 text-office-muted" />
      <input
        id={id}
        type="color"
        aria-label={`${label} color`}
        value={HEX.test(value) ? value.toLowerCase() : "#000000"}
        onChange={(event) => onChange(event.target.value)}
        className="sr-only"
      />
    </label>
  );
}

function FontSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const font = SITE_FONTS[value];
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-office-icon"
      >
        {label}
      </label>
      <div className="relative rounded-lg has-focus-visible:ring-2 has-focus-visible:ring-office-primary">
        {/* The current font, drawn in itself; the native select sits on top. */}
        <div
          aria-hidden="true"
          className="pointer-events-none flex h-11 items-center gap-2 rounded-lg border border-office-meter-track bg-card px-3.5"
        >
          <span
            className="text-base text-office-icon"
            style={{ fontFamily: font?.family, fontWeight: font?.weight }}
          >
            {value}
          </span>
          <span className="text-xs text-office-muted">{font?.weightName}</span>
          <ChevronDown className="ml-auto size-4 text-office-icon" />
        </div>
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer rounded-lg opacity-0"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option} {SITE_FONTS[option]?.weightName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-office-icon">
          {label}
        </label>
        <span className="text-xs text-office-muted">{value} px</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-valuetext={`${value} pixels`}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full cursor-pointer accent-office-primary"
      />
    </div>
  );
}
