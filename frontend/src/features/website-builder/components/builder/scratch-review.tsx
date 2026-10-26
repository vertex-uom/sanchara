"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Monitor,
  Smartphone,
  Tablet,
  X,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import type { Palette } from "../brand-colors-form";
import { DeviceFrame, ScaledScreen, type Device } from "../device-frame";
import { findPreset } from "../palette-presets";
import { SCRATCH_PATH, SCRATCH_STEPS, type FontStyle } from "../scratch-steps";
import { DRAFT_KEYS, useSavedDraft } from "../template-draft";
import { FILE_KEYS, useTemplateFiles } from "../template-files";
import { BOOKING_LINK, isSection } from "./builder-blocks";
import { BuilderCanvas } from "./builder-canvas";
import { useBuilder, type Builder } from "./builder-state";
import { BOOKING_TARGET } from "./nav-model";
import { missingAltBlocks } from "./page-summary";
import { NO_BLOCK_IMAGES } from "./settings-panel";
import { canvasLook, defaultStyles, type SiteStyles } from "./site-styles";

// Index of "Review" in SCRATCH_STEPS.
const STEP = 3;

const DEVICES: { value: Device; label: string; icon: typeof Monitor }[] = [
  { value: "desktop", label: "Desktop", icon: Monitor },
  { value: "tablet", label: "Tablet", icon: Tablet },
  { value: "mobile", label: "Mobile", icon: Smartphone },
];

type ScratchBasics = {
  name: string;
  tagline: string;
  colors: Palette;
  font: FontStyle;
};

type ScratchReviewProps = {
  hotelName: string;
  location: string;
};

// "Start from scratch", step 4: the built site on each device, a summary
// and a checklist before publishing.
export function ScratchReview({ hotelName, location }: ScratchReviewProps) {
  const basics = useSavedDraft<ScratchBasics>(DRAFT_KEYS.scratch);
  const name = basics?.name?.trim() || hotelName;
  const builder = useBuilder({ name, tagline: basics?.tagline ?? "" });
  const [logo] = useTemplateFiles<File | null>(FILE_KEYS.scratchLogo, null);
  const [images] = useTemplateFiles(
    FILE_KEYS.scratchBlockImages,
    NO_BLOCK_IMAGES,
  );
  const [device, setDevice] = useState<Device>("desktop");
  // Devices looked at on this page, for the responsive check.
  const [seen, setSeen] = useState<Set<Device>>(() => new Set(["desktop"]));
  const [fullScreen, setFullScreen] = useState(false);

  const styles = builder.site.styles ?? defaultStyles(basics);
  const home = builder.site.pages[0];
  const allBlocks = builder.site.pages.flatMap((page) => page.blocks);
  const sectionCount = allBlocks.filter((block) =>
    isSection(block.type),
  ).length;
  const homeSections = home.blocks.filter(
    (block) => block.props.hidden !== "true",
  ).length;
  const photos = allBlocks.flatMap((block) => images[block.id] ?? []);
  const missingAlt = missingAltBlocks(allBlocks, images).length;
  const singlePhotos = allBlocks.filter(
    (block) => images[block.id]?.length,
  ).length;
  const untitled = allBlocks.filter(
    (block) => isSection(block.type) && !block.props.title?.trim(),
  ).length;
  const hasBooking = allBlocks.some((block) => block.type === "booking");
  const bookingLinked =
    hasBooking &&
    ((builder.nav.cta.show && builder.nav.cta.target === BOOKING_TARGET) ||
      allBlocks.some(
        (block) =>
          block.props.buttonLink === BOOKING_LINK ||
          block.props.link === BOOKING_LINK,
      ));
  const responsive = seen.has("tablet") && seen.has("mobile");

  const checks = [
    {
      ok: homeSections > 0,
      title: "Sections reviewed",
      text: homeSections
        ? `${homeSections} ${homeSections === 1 ? "section" : "sections"} on the Home page`
        : "Add sections to the Home page",
    },
    {
      ok: missingAlt === 0,
      title: "Images updated",
      text: missingAlt
        ? `${missingAlt} ${missingAlt === 1 ? "photo needs" : "photos need"} alt text`
        : `${photos.length} ${photos.length === 1 ? "photo" : "photos"}${singlePhotos ? ", with alt text where needed" : ""}`,
    },
    {
      ok: untitled === 0 && sectionCount > 0,
      title: "Content completed",
      text: !sectionCount
        ? "No sections yet"
        : untitled
          ? `${untitled} ${untitled === 1 ? "section is" : "sections are"} missing a heading`
          : "Headings, descriptions and details added",
    },
    {
      ok: bookingLinked,
      title: "Booking link added",
      text: bookingLinked
        ? "Booking button is connected"
        : hasBooking
          ? "Point the Book Now button at the booking section"
          : "Add a Booking section",
    },
    {
      ok: responsive,
      title: "Responsive preview checked",
      text: responsive
        ? "Viewed on desktop, tablet and mobile"
        : "Switch to Tablet and Mobile above to check",
    },
  ];
  const left = checks.filter((item) => !item.ok).length;

  function show(next: Device) {
    setDevice(next);
    setSeen((current) => new Set(current).add(next));
  }

  const preview = (
    <SitePreview
      builder={builder}
      name={name}
      logo={logo}
      images={images}
      styles={styles}
      device={device}
    />
  );

  return (
    <div className="relative isolate flex flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 -z-10 size-[30rem] rounded-full bg-office-chart-fill/70 blur-3xl"
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`${SCRATCH_PATH}/builder`}
          className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-medium text-office-primary hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to builder
        </Link>
        <Stepper />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Review Website
          </h1>
          <p className="mt-2 text-sm text-office-muted sm:text-base">
            Check how your website looks before publishing.
          </p>
        </div>
        <DeviceSwitch device={device} onChange={show} />
      </div>

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">{preview}</div>

        <aside
          aria-label="Website summary and checklist"
          className="flex flex-col gap-5 xl:w-80 xl:shrink-0"
        >
          <Card title="Website Summary">
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-office-meter-track bg-office-chip/40 p-3">
              <div
                aria-hidden="true"
                inert
                className="w-24 shrink-0 overflow-hidden rounded-lg border border-black/5"
              >
                <ScaledScreen device="desktop" height={640}>
                  <BuilderCanvas
                    builder={builder}
                    name={name}
                    tagline={basics?.tagline ?? ""}
                    logo={logo}
                    images={images}
                    previewing
                    frameless
                    {...canvasLook(styles, home.background)}
                  />
                </ScaledScreen>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-office-icon">Custom design</p>
                <p className="text-xs text-office-muted">Built from scratch</p>
                <p className="mt-1 inline-block rounded-md bg-office-tint-teal px-2 py-0.5 text-xs font-medium text-office-primary">
                  {sectionCount} {sectionCount === 1 ? "section" : "sections"} ·{" "}
                  {builder.site.pages.length}{" "}
                  {builder.site.pages.length === 1 ? "page" : "pages"}
                </p>
              </div>
            </div>
            <dl className="mt-4 flex flex-col gap-3 border-t border-office-meter-track pt-4 text-sm">
              <Row label="Property" value={name} />
              <Row label="Location" value={location || "—"} />
              <Row label="Brand style" value={brandStyle(styles)} />
            </dl>
          </Card>

          <Card title="Checklist">
            <p className="mt-1 text-xs text-office-muted">
              {left
                ? `${left} ${left === 1 ? "item needs" : "items need"} attention before you publish.`
                : "Everything looks good! You're ready to publish."}
            </p>
            <ul className="mt-4 flex flex-col gap-3.5 border-t border-office-meter-track pt-4">
              {checks.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full",
                      item.ok
                        ? "bg-office-primary text-white"
                        : "bg-office-tint-orange text-office-ink-orange",
                    )}
                  >
                    {item.ok ? (
                      <Check className="size-4" strokeWidth={2.5} />
                    ) : (
                      <AlertTriangle className="size-3.5" />
                    )}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-office-icon">
                      {item.title}
                      <span className="sr-only">
                        {item.ok ? " (done)" : " (to do)"}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "block text-xs",
                        item.ok
                          ? "text-office-muted"
                          : "text-office-ink-orange",
                      )}
                    >
                      {item.text}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <div className="flex flex-col gap-2.5">
            <Button
              type="button"
              variant="office"
              onClick={() => setFullScreen(true)}
              className="h-12 gap-2 text-[0.95rem] font-semibold"
            >
              Preview website
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 border-office-meter-track bg-card text-[0.95rem] font-semibold text-office-icon hover:bg-office-chip"
            >
              <Link
                href={COMPANY_PATHS.website}
                title="Your changes are saved automatically"
              >
                Save as draft
              </Link>
            </Button>
          </div>
        </aside>
      </div>

      <Dialog.Root open={fullScreen} onOpenChange={setFullScreen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-[#0b2240]/50 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed inset-2 z-50 flex flex-col overflow-hidden rounded-2xl bg-[#f4f9fb] shadow-2xl outline-none sm:inset-4">
            <div className="flex flex-wrap items-center gap-3 border-b border-office-meter-track bg-white px-5 py-3">
              <Dialog.Title className="mr-auto font-semibold text-office-icon">
                Website preview
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Your website as guests will see it.
              </Dialog.Description>
              <DeviceSwitch device={device} onChange={show} />
              <Dialog.Close
                aria-label="Close preview"
                className="focus-ring inline-flex size-10 items-center justify-center rounded-lg border border-office-meter-track text-office-icon hover:bg-office-chip"
              >
                <X aria-hidden="true" className="size-4" />
              </Dialog.Close>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              {preview}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

type SitePreviewProps = {
  builder: Builder;
  name: string;
  logo: File | null;
  images: Record<string, File[]>;
  styles: SiteStyles;
  device: Device;
};

// The Home page drawn read-only at the device's real width.
function SitePreview({
  builder,
  name,
  logo,
  images,
  styles,
  device,
}: SitePreviewProps) {
  const page = builder.site.pages[0];
  const canvas = (
    <div className="h-full overflow-y-auto">
      <BuilderCanvas
        builder={builder}
        name={name}
        tagline=""
        logo={logo}
        images={images}
        previewing
        frameless
        {...canvasLook(styles, page.background)}
      />
    </div>
  );

  if (device === "desktop") {
    return (
      <div className="overflow-hidden rounded-xl border border-office-meter-track bg-white shadow-[0_8px_30px_rgb(15_107_110/0.08)]">
        <div
          aria-hidden="true"
          className="flex h-7 items-center gap-1.5 border-b border-black/5 bg-[#eef1f4] px-3"
        >
          <span className="size-2 rounded-full bg-[#ff5f57]" />
          <span className="size-2 rounded-full bg-[#febc2e]" />
          <span className="size-2 rounded-full bg-[#28c840]" />
        </div>
        <ScaledScreen device="desktop">{canvas}</ScaledScreen>
      </div>
    );
  }
  return (
    <div className="flex justify-center">
      <DeviceFrame device={device} url="">
        {canvas}
      </DeviceFrame>
    </div>
  );
}

function DeviceSwitch({
  device,
  onChange,
}: {
  device: Device;
  onChange: (device: Device) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Preview device"
      className="flex gap-1 rounded-xl border border-office-meter-track bg-card p-1"
    >
      {DEVICES.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={device === value}
          onClick={() => onChange(value)}
          className={cn(
            "focus-ring inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium",
            device === value
              ? "border-brand-cyan/60 bg-office-tint-teal text-office-primary"
              : "border-transparent text-office-icon hover:bg-office-chip",
          )}
        >
          <Icon aria-hidden="true" className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

function Stepper() {
  return (
    <nav
      aria-label="Website builder progress"
      className="hidden rounded-2xl border border-office-meter-track bg-card px-3 py-2 lg:block"
    >
      <ol className="flex items-center gap-2">
        {SCRATCH_STEPS.map((step, index) => {
          const done = index < STEP;
          const current = index === STEP;
          return (
            <li key={step.label} className="flex items-center gap-2">
              {index ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-0.5 w-5 rounded",
                    done || current
                      ? "bg-office-icon/70"
                      : "bg-office-meter-track",
                  )}
                />
              ) : null}
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-semibold",
                  current && "bg-office-primary text-white",
                  done && "bg-office-tint-teal text-office-primary",
                  !done &&
                    !current &&
                    "border border-office-meter-track bg-card text-office-muted",
                )}
              >
                {done ? (
                  <Check className="size-4" strokeWidth={2.5} />
                ) : (
                  index + 1
                )}
              </span>
              <span
                aria-current={current ? "step" : undefined}
                className={cn(
                  "text-sm whitespace-nowrap",
                  current
                    ? "font-semibold text-office-icon"
                    : done
                      ? "text-office-icon"
                      : "text-office-muted",
                )}
              >
                {step.label}
                {done ? <span className="sr-only"> (done)</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-office-meter-track bg-card p-5 shadow-[0_4px_16px_rgb(15_107_110/0.06)]">
      <h2 className="font-semibold text-office-icon">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-office-muted">{label}</dt>
      <dd className="font-medium text-office-icon">{value}</dd>
    </div>
  );
}

// "Coastal Teal · Lora + Lexend"
function brandStyle(styles: SiteStyles) {
  const { colors } = styles;
  const preset = findPreset({
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,
    background: colors.surface,
  });
  return `${preset?.name ?? "Custom colors"} · ${styles.headingFont} + ${styles.bodyFont}`;
}
