import type { Palette } from "../brand-colors-form";
import { PALETTE_PRESETS } from "../palette-presets";
import { readableOn } from "../preview-site";
import { FONT_STYLES, type FontStyle } from "../scratch-steps";

// Site-wide look set in "Site Styles": colors, fonts, text size, button
// shape and corner radius. Saved with the site once applied; until then it
// comes from Site basics.

export type SiteColors = {
  primary: string;
  secondary: string;
  accent: string;
  // Page background, and the tint used for cards and alternate sections.
  background: string;
  surface: string;
};

export type SiteStyles = {
  colors: SiteColors;
  headingFont: string;
  bodyFont: string;
  // Body text size in px; every text size on the site scales with it.
  textSize: number;
  buttonShape: "Square" | "Rounded" | "Pill";
  // Cards and photos, in px.
  radius: number;
};

// Fonts loaded for the site (site-fonts.ts) and the weight each is shown in.
export const SITE_FONTS: Record<
  string,
  { family: string; weight: number; weightName: string }
> = {
  Lora: {
    family: "var(--font-lora), Georgia, serif",
    weight: 500,
    weightName: "Medium",
  },
  "Playfair Display": {
    family: "var(--font-playfair), Georgia, serif",
    weight: 500,
    weightName: "Medium",
  },
  Lexend: {
    family: "var(--font-lexend), sans-serif",
    weight: 400,
    weightName: "Regular",
  },
  Inter: {
    family: "var(--font-inter), sans-serif",
    weight: 400,
    weightName: "Regular",
  },
};
export const HEADING_FONTS = ["Lora", "Playfair Display", "Lexend", "Inter"];
export const BODY_FONTS = ["Lexend", "Inter", "Lora"];
export const BUTTON_SHAPES = ["Square", "Rounded", "Pill"] as const;
const BUTTON_RADIUS: Record<SiteStyles["buttonShape"], string> = {
  Square: "2px",
  Rounded: "8px",
  Pill: "999px",
};
export const TEXT_SIZE = { min: 14, max: 20 };
export const RADIUS_MAX = 24;

export const COLOR_ROWS: { key: keyof SiteColors; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "accent", label: "Accent" },
  { key: "background", label: "Background" },
  { key: "surface", label: "Surface" },
];

// Tailwind text sizes (rem) that are rescaled inside the canvas.
const TEXT_STEPS: Record<string, number> = {
  xs: 0.75,
  sm: 0.875,
  base: 1,
  lg: 1.125,
  xl: 1.25,
  "2xl": 1.5,
  "3xl": 1.875,
  "4xl": 2.25,
  "5xl": 3,
};

const FONT_NAMES: Record<FontStyle, { heading: string; body: string }> = {
  elegant: { heading: "Lora", body: "Lexend" },
  classic: { heading: "Playfair Display", body: "Inter" },
  modern: { heading: "Lexend", body: "Lexend" },
};

// Styles before any are applied: Site basics' palette and font style.
export function defaultStyles(
  basics: { colors?: Partial<Palette>; font?: FontStyle } | null,
): SiteStyles {
  const colors = { ...PALETTE_PRESETS[0].colors, ...basics?.colors };
  const font =
    FONT_NAMES[basics?.font ?? FONT_STYLES[0].value] ?? FONT_NAMES.elegant;
  return {
    colors: {
      primary: colors.primary,
      secondary: colors.secondary,
      accent: colors.accent,
      background: "#FFFFFF",
      surface: colors.background,
    },
    headingFont: font.heading,
    bodyFont: font.body,
    textSize: 16,
    buttonShape: "Rounded",
    radius: 12,
  };
}

// CSS variables for the canvas from the styles.
export function styleVariables(styles: SiteStyles): Record<string, string> {
  const heading = SITE_FONTS[styles.headingFont] ?? SITE_FONTS.Lora;
  const body = SITE_FONTS[styles.bodyFont] ?? SITE_FONTS.Lexend;
  const scale = styles.textSize / 16;
  const vars: Record<string, string> = {
    "--site-primary": styles.colors.primary,
    "--site-on-primary": readableOn(styles.colors.primary),
    "--site-secondary": styles.colors.secondary,
    "--site-accent": styles.colors.accent,
    "--site-heading": heading.family,
    "--site-heading-weight": String(heading.weight),
    "--site-body": body.family,
    "--site-btn-radius":
      BUTTON_RADIUS[styles.buttonShape] ?? BUTTON_RADIUS.Rounded,
    "--site-radius": `${styles.radius}px`,
  };
  for (const [step, rem] of Object.entries(TEXT_STEPS)) {
    vars[`--text-${step}`] = `${(rem * scale).toFixed(4)}rem`;
  }
  return vars;
}

export function isSameStyles(a: SiteStyles, b: SiteStyles) {
  return JSON.stringify(a) === JSON.stringify(b);
}
