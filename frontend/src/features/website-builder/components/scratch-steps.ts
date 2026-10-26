import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import type { FlowStep } from "./template-steps";

export const SCRATCH_PATH = `${COMPANY_PATHS.website}/scratch`;

// "Start from scratch" flow; href is set once a step's page exists.
export const SCRATCH_STEPS: FlowStep[] = [
  { label: "Choose method", href: `${COMPANY_PATHS.website}/templates` },
  { label: "Site basics", href: SCRATCH_PATH },
  { label: "Build page", href: `${SCRATCH_PATH}/builder` },
  { label: "Review" },
  { label: "Publish" },
];

export type FontStyle = "elegant" | "classic" | "modern";

// Heading + body fonts for each style (CSS variables from site-fonts.ts).
export const FONT_STYLES: {
  value: FontStyle;
  label: string;
  fonts: string;
  heading: string;
  body: string;
  weight: number;
}[] = [
  {
    value: "elegant",
    label: "Elegant",
    fonts: "Lora + Lexend",
    heading: "var(--font-lora), Georgia, serif",
    body: "var(--font-lexend), sans-serif",
    weight: 400,
  },
  {
    value: "classic",
    label: "Classic",
    fonts: "Playfair Display + Inter",
    heading: "var(--font-playfair), Georgia, serif",
    body: "var(--font-inter), sans-serif",
    weight: 400,
  },
  {
    value: "modern",
    label: "Modern",
    fonts: "Lexend + Lexend",
    heading: "var(--font-lexend), sans-serif",
    body: "var(--font-lexend), sans-serif",
    weight: 600,
  },
];
