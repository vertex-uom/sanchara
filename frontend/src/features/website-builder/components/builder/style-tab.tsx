"use client";

import type { ReactNode } from "react";
import { cn } from "cn";
import { SelectInput, Switch } from "../template-fields";
import { isSection, type BuilderBlock } from "./builder-blocks";
import type { Builder, PageBackground } from "./builder-state";
import {
  ALIGNMENTS,
  ANIMATIONS,
  BACKGROUND_KEYS,
  backgroundMode,
  GRADIENTS,
  HEADING_SIZES,
  HEIGHTS,
  OVERLAY_COLORS,
  PADDING_MAX,
  paddingValue,
  SECTION_BACKGROUNDS,
  TEXT_COLORS,
} from "./section-style";

type StyleTabProps = {
  builder: Builder;
  block: BuilderBlock;
  backgrounds: Record<PageBackground, string>;
};

// Style tab for the selected block: background, overlay, text, size,
// spacing, animation and layout options. Values are block props.
export function StyleTab({ builder, block, backgrounds }: StyleTabProps) {
  const p = block.props;
  // Repeated changes to one setting (a slider drag) are one undo step.
  const set = (key: string, value: string) =>
    builder.updateBlock(block.id, key, value);
  const section = isSection(block.type);
  // Only a full-bleed hero has a background photo to style.
  const photo = block.type === "hero" && p.layout !== "Split";
  const mode = backgroundMode(block);
  const modes = photo ? ["Image", "Color", "Gradient"] : ["Color", "Gradient"];
  const id = (name: string) => `style-${block.id}-${name}`;

  return (
    <div className="flex flex-col gap-5">
      <Group label="Background">
        <Segmented
          options={modes}
          value={modes.includes(mode) ? mode : modes[0]}
          onChange={(value) => set("bgMode", value)}
        />
      </Group>

      {mode === "Image" && photo ? (
        <>
          <Group label="Overlay color">
            <Swatches
              name={id("overlay")}
              options={Object.entries(OVERLAY_COLORS).map(([label, color]) => ({
                label,
                color,
              }))}
              value={p.overlayColor ?? ""}
              onChange={(value) => set("overlayColor", value)}
            />
          </Group>
          <Slider
            id={id("opacity")}
            label="Overlay opacity"
            value={Number(p.overlayOpacity ?? 30)}
            max={90}
            step={5}
            unit="%"
            disabled={!p.overlayColor}
            hint={p.overlayColor ? undefined : "Pick an overlay color first"}
            onChange={(value) => set("overlayOpacity", String(value))}
          />
        </>
      ) : null}

      {mode === "Color" ? (
        <Group label="Background color">
          <Swatches
            name={id("background")}
            options={SECTION_BACKGROUNDS.map((label) => {
              const key = BACKGROUND_KEYS[label];
              return {
                label: label === "Page" ? "Same as page" : label,
                value: label,
                color: key ? backgrounds[key] : null,
              };
            })}
            value={p.background || "Page"}
            onChange={(value) => set("background", value)}
          />
        </Group>
      ) : null}

      {mode === "Gradient" ? (
        <Group label="Gradient">
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(GRADIENTS).map(([label, gradient]) => {
              const checked = (p.gradient || "Brand") === label;
              return (
                <label key={label} className="cursor-pointer">
                  <input
                    type="radio"
                    name={id("gradient")}
                    checked={checked}
                    onChange={() => set("gradient", label)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "block h-9 rounded-lg border border-black/10 ring-offset-2 peer-focus-visible:ring-2 peer-focus-visible:ring-office-primary",
                      checked && "ring-2 ring-office-primary",
                    )}
                    style={{ backgroundImage: gradient.value }}
                  />
                  <span className="mt-1 block text-center text-[0.7rem] text-office-muted">
                    {label}
                  </span>
                </label>
              );
            })}
          </div>
        </Group>
      ) : null}

      <Group label="Text color">
        <Swatches
          name={id("text")}
          options={[
            { label: "Automatic", value: "", color: null },
            ...Object.entries(TEXT_COLORS).map(([label, color]) => ({
              label,
              color,
            })),
          ]}
          value={p.textColor ?? ""}
          onChange={(value) => set("textColor", value)}
        />
      </Group>

      <Group label="Heading size">
        <Segmented
          options={[...HEADING_SIZES]}
          value={p.headingSize || (block.type === "hero" ? "L" : "M")}
          onChange={(value) => set("headingSize", value)}
        />
      </Group>

      {section ? (
        <>
          <Group label="Text alignment">
            <Segmented
              options={[...ALIGNMENTS]}
              value={p.align || "Left"}
              onChange={(value) => set("align", value)}
            />
          </Group>
          <Group label="Section height">
            <Segmented
              options={[...HEIGHTS]}
              value={p.height || "Auto"}
              onChange={(value) => set("height", value)}
            />
          </Group>
          <Slider
            id={id("padding-top")}
            label="Padding top"
            value={paddingValue(block, "Top")}
            max={PADDING_MAX}
            step={8}
            unit=" px"
            onChange={(value) => set("paddingTop", String(value))}
          />
          <Slider
            id={id("padding-bottom")}
            label="Padding bottom"
            value={paddingValue(block, "Bottom")}
            max={PADDING_MAX}
            step={8}
            unit=" px"
            onChange={(value) => set("paddingBottom", String(value))}
          />
        </>
      ) : null}

      <div>
        <label
          htmlFor={id("animation")}
          className="mb-2 block text-sm font-semibold text-office-icon"
        >
          Entrance animation
        </label>
        <SelectInput
          id={id("animation")}
          options={[...ANIMATIONS]}
          value={p.animation || "None"}
          onChange={(event) => set("animation", event.target.value)}
        />
        <p className="mt-1.5 text-xs text-office-muted">
          Plays in Preview and on the live site.
        </p>
      </div>

      {section ? (
        <SwitchRow
          id={id("full-width")}
          label="Full width"
          checked={p.fullWidth !== "false"}
          onChange={(on) => set("fullWidth", on ? "" : "false")}
        />
      ) : null}
      {photo && mode === "Image" ? (
        <SwitchRow
          id={id("parallax")}
          label="Parallax background"
          checked={p.parallax === "true"}
          onChange={(on) => set("parallax", on ? "true" : "")}
        />
      ) : null}
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-office-icon">
        {label}
      </legend>
      {children}
    </fieldset>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className="grid rounded-lg border border-office-meter-track p-1"
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "focus-ring h-8 rounded-md text-xs font-medium",
            value === option
              ? "bg-office-primary text-white"
              : "text-office-icon hover:bg-office-chip",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

type Swatch = { label: string; value?: string; color: string | null };

// Round color choices; a swatch without a color is "automatic".
function Swatches({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: Swatch[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((option) => {
        const optionValue = option.value ?? option.label;
        const checked = value === optionValue;
        return (
          <label
            key={option.label}
            className="cursor-pointer"
            title={option.label}
          >
            <input
              type="radio"
              name={name}
              checked={checked}
              onChange={() => onChange(optionValue)}
              className="peer sr-only"
            />
            <span className="sr-only">{option.label}</span>
            <span
              aria-hidden="true"
              className={cn(
                "flex size-8 items-center justify-center rounded-full border border-black/15 text-[0.6rem] font-semibold text-office-muted ring-offset-2 peer-focus-visible:ring-2 peer-focus-visible:ring-office-primary",
                checked && "ring-2 ring-office-primary",
              )}
              style={option.color ? { background: option.color } : undefined}
            >
              {option.color ? null : "Auto"}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function Slider({
  id,
  label,
  value,
  max,
  step,
  unit,
  disabled,
  hint,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  max: number;
  step: number;
  unit: string;
  disabled?: boolean;
  hint?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className={cn(disabled && "opacity-50")}>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-office-icon">
          {label}
        </label>
        <span className="text-xs text-office-muted">
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={`${value}${unit}`}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full cursor-pointer accent-office-primary disabled:cursor-not-allowed"
      />
      {hint ? <p className="mt-1 text-xs text-office-muted">{hint}</p> : null}
    </div>
  );
}

function SwitchRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        id={`${id}-label`}
        className="text-sm font-semibold text-office-icon"
      >
        {label}
      </span>
      <Switch
        id={id}
        aria-labelledby={`${id}-label`}
        checked={checked}
        onChange={onChange}
      />
    </div>
  );
}
