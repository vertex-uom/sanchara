import type { CSSProperties } from "react";
import { cn } from "cn";
import { isSection, type BuilderBlock } from "./builder-blocks";
import type { PageBackground } from "./builder-state";

// A block's Style tab settings, stored as props, and how the canvas applies
// them. Unset props keep the block's own look.

// Background → Color. "Page" keeps the page background.
export const SECTION_BACKGROUNDS = [
  "Page",
  "White",
  "Brand",
  "Light",
  "Aqua",
  "Dark",
] as const;
export const BACKGROUND_KEYS: Record<
  (typeof SECTION_BACKGROUNDS)[number],
  PageBackground | null
> = {
  Page: null,
  White: "white",
  Brand: "brand",
  Light: "light",
  Aqua: "aqua",
  Dark: "dark",
};

// Background → Gradient; dark ones get light text.
export const GRADIENTS: Record<string, { value: string; dark: boolean }> = {
  Brand: {
    value:
      "linear-gradient(135deg, var(--site-primary), var(--site-secondary))",
    dark: true,
  },
  Sunrise: {
    value: "linear-gradient(135deg, var(--site-accent), var(--site-primary))",
    dark: true,
  },
  Night: {
    value: "linear-gradient(180deg, var(--site-secondary), #0b1626)",
    dark: true,
  },
  Lagoon: { value: "linear-gradient(180deg, #e6f4f4, #ffffff)", dark: false },
};

export const OVERLAY_COLORS: Record<string, string> = {
  Navy: "var(--site-secondary)",
  Teal: "var(--site-primary)",
  Black: "#000000",
  White: "#ffffff",
};

export const TEXT_COLORS: Record<string, string> = {
  White: "#ffffff",
  Navy: "var(--site-secondary)",
  Teal: "var(--site-primary)",
  Gold: "var(--site-accent)",
};

export const HEADING_SIZES = ["S", "M", "L", "XL"] as const;
export const ALIGNMENTS = ["Left", "Center", "Right"] as const;
export const HEIGHTS = ["Auto", "Medium", "Full"] as const;
export const ANIMATIONS = [
  "None",
  "Fade in",
  "Fade up on scroll",
  "Slide in",
  "Zoom in",
] as const;
export const PADDING_MAX = 160;

const HEADING_CLASSES: Record<string, string> = {
  S: "[&_h2]:text-2xl!",
  M: "[&_h2]:text-3xl!",
  L: "[&_h2]:text-4xl!",
  XL: "[&_h2]:text-5xl!",
};
const ALIGN_CLASSES: Record<string, string> = {
  Left: "text-left",
  Center: "text-center [&_.section-text]:mx-auto",
  Right: "text-right [&_.section-text]:ml-auto",
};
const HEIGHT_VALUES: Record<string, string> = {
  Medium: "32rem",
  Full: "44rem",
};
// Played while scrolling into view (Preview), using tw-animate's enter animation.
const ANIMATION_CLASSES: Record<string, string> = {
  "Fade in": "motion-safe:fade-in",
  "Fade up on scroll": "motion-safe:fade-in motion-safe:slide-in-from-bottom-8",
  "Slide in": "motion-safe:fade-in motion-safe:slide-in-from-left-12",
  "Zoom in": "motion-safe:fade-in motion-safe:zoom-in-95",
};
const ANIMATION_BASE =
  "motion-safe:animate-in motion-safe:fill-mode-both motion-safe:[animation-timeline:view()] motion-safe:[animation-range:entry_0%_entry_70%]";

// Legacy "Spacing" choice (before padding sliders), as top/bottom px.
const LEGACY_SPACING: Record<string, number> = {
  Compact: 28,
  Normal: 56,
  Spacious: 80,
};

export function backgroundMode(block: BuilderBlock) {
  return block.props.bgMode || (block.type === "hero" ? "Image" : "Color");
}

// Padding in px for the sliders: set value, old Spacing choice, or default.
export function paddingValue(block: BuilderBlock, side: "Top" | "Bottom") {
  const set = block.props[`padding${side}`];
  if (set) return Number(set);
  return LEGACY_SPACING[block.props.spacing] ?? LEGACY_SPACING.Normal;
}

export function sectionStyle(
  block: BuilderBlock,
  backgrounds: Record<PageBackground, string>,
  previewing: boolean,
): { style: CSSProperties; className: string } {
  const p = block.props;
  const style: Record<string, string> = {};
  const mode = backgroundMode(block);
  let dark = false;

  if (mode === "Color") {
    const key = p.background
      ? BACKGROUND_KEYS[p.background as keyof typeof BACKGROUND_KEYS]
      : null;
    if (key) {
      style.backgroundColor = backgrounds[key];
      dark = key === "dark";
      if (!dark) style["--site-text"] = "#1f2933";
    }
  } else if (mode === "Gradient") {
    const gradient = GRADIENTS[p.gradient] ?? GRADIENTS.Brand;
    style.backgroundImage = gradient.value;
    dark = gradient.dark;
  } else if (
    p.overlayColor &&
    p.overlayColor !== "White" &&
    Number(p.overlayOpacity ?? 30) >= 40
  ) {
    // A strong dark overlay on the photo: light text reads better.
    dark = true;
  }

  const text = TEXT_COLORS[p.textColor] ?? (dark ? "#ffffff" : null);
  if (text) {
    style["--site-text"] = text;
    style["--site-muted"] =
      dark && !TEXT_COLORS[p.textColor] ? "rgb(255 255 255 / 0.78)" : text;
    style["--hero-text"] = text;
  }
  if (dark) style["--site-surface"] = "rgb(255 255 255 / 0.08)";

  if (isSection(block.type)) {
    for (const side of ["Top", "Bottom"] as const) {
      if (p[`padding${side}`] || p.spacing) {
        const px = `${paddingValue(block, side)}px`;
        const name = side === "Top" ? "pt" : "pb";
        style[`--section-${name}`] = px;
        style[`--section-${name}-lg`] = px;
      }
    }
    if (HEIGHT_VALUES[p.height]) style.minHeight = HEIGHT_VALUES[p.height];
  }

  const className = cn(
    HEADING_CLASSES[p.headingSize],
    ALIGN_CLASSES[p.align && isSection(block.type) ? p.align : ""],
    HEIGHT_VALUES[p.height] && "flex flex-col [&>section]:flex-1",
    p.fullWidth === "false" && "[&>section]:mx-auto [&>section]:max-w-4xl",
    previewing &&
      ANIMATION_CLASSES[p.animation] &&
      cn(ANIMATION_BASE, ANIMATION_CLASSES[p.animation]),
  );
  return { style: style as CSSProperties, className };
}
