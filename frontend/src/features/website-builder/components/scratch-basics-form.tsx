"use client";

import { type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import type { Palette } from "./brand-colors-form";
import { ImageUpload } from "./image-upload";
import { findPreset, PALETTE_PRESETS, PresetPicker } from "./palette-presets";
import { FONT_STYLES, SCRATCH_PATH, type FontStyle } from "./scratch-steps";
import { DRAFT_KEYS, useTemplateDraft } from "./template-draft";
import { Field, formCardClass, inputClass } from "./template-fields";
import { FILE_KEYS, useTemplateFiles } from "./template-files";

const MB = 1024 * 1024;

type ScratchBasics = {
  name: string;
  tagline: string;
  colors: Palette;
  font: FontStyle;
};

// "Start from scratch", step 2: name, tagline, logo, colors and fonts that
// every block uses. The logo lives in the in-memory file store.
export function ScratchBasicsForm({ hotelName }: { hotelName: string }) {
  const router = useRouter();
  const { values, update, save } = useTemplateDraft<ScratchBasics>(
    DRAFT_KEYS.scratch,
    {
      name: hotelName,
      tagline: "",
      colors: PALETTE_PRESETS[0].colors,
      font: "elegant",
    },
  );
  const [logo, setLogo] = useTemplateFiles<File | null>(
    FILE_KEYS.scratchLogo,
    null,
  );

  const preset = findPreset(values.colors);
  const font =
    FONT_STYLES.find((option) => option.value === values.font) ??
    FONT_STYLES[0];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save();
    router.push(`${SCRATCH_PATH}/builder`);
  }

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <form
        id="scratch-basics-form"
        onSubmit={handleSubmit}
        className={cn(formCardClass, "flex min-w-0 flex-1 flex-col gap-5")}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="website-name" label="Website name">
            <input
              id="website-name"
              required
              maxLength={80}
              value={values.name}
              onChange={(event) => update({ name: event.target.value })}
              placeholder="Palm Breeze Guest House"
              className={inputClass}
            />
          </Field>
          <Field id="website-tagline" label="Tagline" hint="Optional">
            <input
              id="website-tagline"
              maxLength={80}
              value={values.tagline}
              onChange={(event) => update({ tagline: event.target.value })}
              placeholder="Relax. Explore. Feel at Home."
              className={inputClass}
            />
          </Field>
        </div>

        <ImageUpload
          id="scratch-logo-upload"
          label="Logo"
          hint="PNG or SVG, up to 2 MB"
          types={["image/png", "image/svg+xml"]}
          maxBytes={2 * MB}
          fit="contain"
          file={logo}
          onChange={setLogo}
        />

        <PresetPicker
          legend="Brand colors"
          hint="You can change these later"
          value={values.colors}
          onChange={(colors) => update({ colors })}
        />

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-office-icon">
            Font style
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {FONT_STYLES.map((option) => {
              const selected = option.value === values.font;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "cursor-pointer rounded-xl border-[1.5px] p-4 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-office-primary",
                    selected
                      ? "border-brand-cyan bg-[#f4fafa]"
                      : "border-office-meter-track bg-card hover:border-brand-cyan/60",
                  )}
                >
                  <input
                    type="radio"
                    name="font-style"
                    value={option.value}
                    checked={selected}
                    onChange={() => update({ font: option.value })}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="block text-3xl text-office-icon"
                    style={{
                      fontFamily: option.heading,
                      fontWeight: option.weight,
                    }}
                  >
                    Aa
                  </span>
                  <span className="mt-3 block text-sm font-semibold text-office-icon">
                    {option.label}
                  </span>
                  <span className="block text-xs text-office-muted">
                    {option.fonts}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </form>

      <aside
        aria-label="Your style"
        className="rounded-2xl border border-office-meter-track bg-card p-5 shadow-[0_4px_16px_rgb(15_107_110/0.06)] xl:sticky xl:top-24 xl:w-80 xl:shrink-0"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-office-icon">Your style</h2>
          <span className="rounded-full bg-office-tint-teal px-2 py-0.5 text-xs font-medium text-office-primary">
            {preset?.name ?? "Custom colors"} · {font.label}
          </span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-office-muted">
          Your colors and fonts are applied automatically to every block you
          add. You can fine-tune each block later.
        </p>
        <Button
          type="submit"
          form="scratch-basics-form"
          variant="office"
          className="mt-5 h-11 w-full gap-2.5 text-[0.95rem] font-semibold"
        >
          Continue to builder
          <ArrowRight aria-hidden="true" className="size-[18px]" />
        </Button>
        <Button
          asChild
          variant="outline"
          className="mt-3 h-11 w-full border-office-meter-track bg-card text-[0.95rem] font-semibold text-office-icon hover:bg-office-chip"
        >
          <Link href={`${COMPANY_PATHS.website}/templates`}>Back</Link>
        </Button>
      </aside>
    </div>
  );
}
