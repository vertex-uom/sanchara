import Link from "next/link";
import {
  ArrowLeft,
  Box,
  Image as ImageIcon,
  Pencil,
  Settings,
  ToggleRight,
  Zap,
} from "lucide-react";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { OptionCard, type OptionCardProps } from "./option-card";

const hotelTemplate: OptionCardProps = {
  icon: ImageIcon,
  title: "Use our hotel template",
  description:
    "Fill in one simple form with your hotel details, rooms, prices and colors. We build your website on our professional hotel template.",
  points: [
    { icon: ImageIcon, text: "One proven hotel template" },
    { icon: ToggleRight, text: "Simple step-by-step form" },
    { icon: Zap, text: "Add rooms, prices & policies" },
  ],
  action: {
    label: "Start the form",
    href: `${COMPANY_PATHS.website}/template-form`,
  },
};

const fromScratch: OptionCardProps = {
  icon: Pencil,
  title: "Start from scratch",
  description:
    "Build your website from a blank canvas and design every section the way you want.",
  points: [
    { icon: Pencil, text: "Full creative control" },
    { icon: Box, text: "Add and arrange blocks easily" },
    { icon: Settings, text: "Build at your own pace" },
  ],
  action: {
    label: "Start from scratch",
    href: `${COMPANY_PATHS.website}/scratch`,
  },
};

// Second step after "Get started": fill in the hotel template or build from a blank canvas.
export function WebsiteBuilderMethod() {
  return (
    <div className="relative isolate flex min-h-full flex-col items-center overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 -z-10 size-112 rounded-full bg-office-chart-fill/70 blur-3xl"
      />
      <Link
        href={COMPANY_PATHS.website}
        className="inline-flex items-center gap-2 self-start rounded-md text-sm font-medium text-office-primary hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to options
      </Link>
      <section
        aria-labelledby="website-method-title"
        className="mt-2 max-w-2xl text-center"
      >
        <p className="text-xs font-medium tracking-[0.18em] text-office-primary uppercase">
          Website builder
        </p>
        <h1
          id="website-method-title"
          className="mt-3 text-2xl leading-tight font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          How would you like to create your website?
        </h1>
        <p className="mt-3 text-sm text-office-muted">
          Choose the method that works best for you. You can always change this
          later.
        </p>
      </section>
      <div className="mt-8 grid w-full max-w-md gap-5 md:max-w-192 md:grid-cols-2">
        <OptionCard {...hotelTemplate} />
        <OptionCard {...fromScratch} />
      </div>
    </div>
  );
}
