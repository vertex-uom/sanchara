"use client";

import { type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Pencil } from "lucide-react";
import { cn } from "cn";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { DRAFT_KEYS, useTemplateDraft } from "./template-draft";
import { formCardClass } from "./template-fields";
import { TemplateProgress } from "./template-progress";

type ColorKey = "primary" | "secondary" | "accent" | "background";
export type Palette = Record<ColorKey, string>;

const FORM_PATH = `${COMPANY_PATHS.website}/template-form`;

// Swatches read primary, secondary, background, accent, as in the design.
const PRESETS: {
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

const COLOR_FIELDS: { key: ColorKey; label: string; required: boolean }[] = [
  { key: "primary", label: "Primary color", required: true },
  { key: "secondary", label: "Secondary color", required: true },
  { key: "accent", label: "Button / accent color", required: true },
  { key: "background", label: "Background color", required: false },
];

export const HEX = /^#[0-9a-f]{6}$/i;

// Step 2 of the hotel template form: the palette used on every page.
export function BrandColorsForm() {
  const router = useRouter();
  const { values, update, save, saved } = useTemplateDraft<Palette>(
    DRAFT_KEYS.brand,
    PRESETS[0].colors,
  );

  const preset = PRESETS.find((option) =>
    (Object.keys(option.colors) as ColorKey[]).every(
      (key) => option.colors[key].toLowerCase() === values[key].toLowerCase(),
    ),
  );
  const valid = (Object.values(values) as string[]).every((value) =>
    HEX.test(value),
  );
  const lowContrast = valid ? contrastProblems(values) : [];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid) return;
    save();
    router.push(`${FORM_PATH}/rooms`);
  }

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <form
        id="brand-colors-form"
        onSubmit={handleSubmit}
        noValidate
        className={cn(formCardClass, "min-w-0 flex-1")}
      >
        <h2 className="text-lg font-semibold text-office-icon">
          Color palette
        </h2>
        <p className="mt-1 text-sm text-office-muted">
          Start from a preset or enter your own brand colors.
        </p>

        <fieldset className="mt-5">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <legend className="text-sm font-semibold text-office-icon">
              Start with a preset
            </legend>
            <span className="text-xs text-office-muted">Optional</span>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {PRESETS.map((option) => {
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
                    onChange={() => update(option.colors)}
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

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {COLOR_FIELDS.map(({ key, label, required }) => (
            <ColorField
              key={key}
              id={`color-${key}`}
              label={label}
              required={required}
              value={values[key]}
              name={preset?.names[key] ?? "Custom"}
              onChange={(value) => update({ [key]: value } as Partial<Palette>)}
            />
          ))}
        </div>

        {!valid ? (
          <p
            role="alert"
            className="mt-5 flex items-center gap-2 rounded-lg bg-office-danger-soft px-4 py-3 text-sm text-office-danger-text"
          >
            <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
            Enter each color as a 6-digit hex code, for example #0E5E52.
          </p>
        ) : lowContrast.length ? (
          <p
            role="status"
            className="mt-5 flex items-center gap-2 rounded-lg bg-office-tint-orange px-4 py-3 text-sm text-office-ink-orange"
          >
            <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
            Low contrast: {lowContrast.join(" and ")} may be hard to read on
            these colors.
          </p>
        ) : (
          <p
            role="status"
            className="mt-5 flex items-center gap-2 rounded-lg bg-office-tint-teal px-4 py-3 text-sm text-office-primary"
          >
            <Check aria-hidden="true" className="size-4 shrink-0" />
            Good contrast — text and buttons are easy to read on these colors.
          </p>
        )}
      </form>

      <TemplateProgress
        formStep={2}
        note="These colors and fonts are applied to every page of the template when we build your website."
        formId="brand-colors-form"
        backHref={FORM_PATH}
        onSaveDraft={save}
        saved={saved}
      />
    </div>
  );
}

type ColorFieldProps = {
  id: string;
  label: string;
  required: boolean;
  value: string;
  name: string;
  onChange: (value: string) => void;
};

// Swatch + hex text box; the swatch and pencil open the browser's color picker.
function ColorField({
  id,
  label,
  required,
  value,
  name,
  onChange,
}: ColorFieldProps) {
  const valid = HEX.test(value);
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-office-icon"
      >
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <div
        className={cn(
          "flex h-12 items-center gap-3 rounded-lg border bg-card px-3 has-focus-visible:ring-2 has-focus-visible:ring-office-primary",
          valid ? "border-office-meter-track" : "border-office-danger",
        )}
      >
        <label className="relative size-6 shrink-0 cursor-pointer overflow-hidden rounded-md border border-black/10">
          <span className="sr-only">Pick {label.toLowerCase()}</span>
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{ backgroundColor: valid ? value : "transparent" }}
          />
          <input
            type="color"
            value={valid ? value.toLowerCase() : "#000000"}
            onChange={(event) => onChange(event.target.value.toUpperCase())}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <input
          id={id}
          value={value}
          onChange={(event) =>
            onChange(event.target.value.trim().toUpperCase())
          }
          maxLength={7}
          spellCheck={false}
          aria-invalid={!valid}
          className="w-full min-w-0 bg-transparent text-sm font-semibold text-office-icon uppercase outline-none"
        />
        <span className="shrink-0 text-sm text-office-muted">{name}</span>
        <label className="relative shrink-0 cursor-pointer text-office-icon">
          <span className="sr-only">Edit {label.toLowerCase()}</span>
          <Pencil aria-hidden="true" className="size-4" />
          <input
            type="color"
            tabIndex={-1}
            value={valid ? value.toLowerCase() : "#000000"}
            onChange={(event) => onChange(event.target.value.toUpperCase())}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
}

// WCAG 2 checks: headings (primary, secondary) on the background need 3:1 as
// large text, and the button label (white or dark, whichever reads better)
// needs 4.5:1 on the accent.
function contrastProblems({ primary, secondary, accent, background }: Palette) {
  const problems: string[] = [];
  if (contrast(primary, background) < 3) problems.push("primary text");
  if (contrast(secondary, background) < 3) problems.push("secondary text");
  if (Math.max(contrast(accent, "#FFFFFF"), contrast(accent, "#0B2545")) < 4.5)
    problems.push("button labels");
  return problems;
}

function contrast(a: string, b: string) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
