"use client";

import Link from "next/link";
import { AlertTriangle, Check, CircleCheck, Eye, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { BookingEngineStatus } from "@/features/website";
import { timeAgo } from "../template-status";
import type { BuilderBlock } from "./builder-blocks";
import { PAGE_SETTINGS_SELECTION, type Builder } from "./builder-state";

type PageSummaryProps = {
  builder: Builder;
  images: Record<string, File[]>;
  bookingEngine: BookingEngineStatus;
  onPreview: () => void;
  reviewHref: string;
};

// Assumed connection for the load time estimate (a typical mobile line).
const BITS_PER_SECOND = 10_000_000;
const BASE_SECONDS = 0.6;

// Blocks with one photo, and the prop holding its alt text.
const PHOTO_ALT: Partial<Record<BuilderBlock["type"], string>> = {
  hero: "imagesAlt",
  about: "imageAlt",
  booking: "imageAlt",
  image: "imageAlt",
};

// Blocks whose single photo has no alt text yet.
export function missingAltBlocks(
  blocks: BuilderBlock[],
  images: Record<string, File[]>,
) {
  return blocks.filter((block) => {
    const key = PHOTO_ALT[block.type];
    return Boolean(
      key && images[block.id]?.length && !block.props[key]?.trim(),
    );
  });
}

// Right panel when nothing is selected: the page at a glance and what is
// left to do before publishing.
export function PageSummary({
  builder,
  images,
  bookingEngine,
  onPreview,
  reviewHref,
}: PageSummaryProps) {
  const { page, site } = builder;
  const allBlocks = site.pages.flatMap((item) => item.blocks);
  const photos = page.blocks.flatMap((block) => images[block.id] ?? []);
  const bytes = photos.reduce((total, file) => total + file.size, 0);
  const seconds = BASE_SECONDS + (bytes * 8) / BITS_PER_SECOND;
  const speed = seconds < 2 ? "Fast" : seconds < 4 ? "Moderate" : "Slow";

  const missingAlt = missingAltBlocks(page.blocks, images);

  const hasHero = page.blocks.some((block) => block.type === "hero");
  const hasBooking = allBlocks.some((block) => block.type === "booking");
  const contact = allBlocks.find(
    (block) =>
      block.type === "contact" &&
      block.props.address?.trim() &&
      block.props.phone?.trim() &&
      block.props.email?.trim(),
  );

  const checks = [
    {
      ok: hasHero && hasBooking,
      text:
        hasHero && hasBooking
          ? "Hero and booking sections added"
          : !hasHero && !hasBooking
            ? "Add a Hero and a Booking section"
            : !hasHero
              ? "Add a Hero section to this page"
              : "Add a Booking section to your site",
    },
    {
      ok: bookingEngine === "live",
      text:
        bookingEngine === "live"
          ? "Booking engine connected"
          : "Booking engine is offline",
    },
    {
      ok: Boolean(contact),
      text: contact
        ? "Contact details complete"
        : "Add address, phone and email in a Contact section",
    },
    {
      ok: missingAlt.length === 0,
      text: missingAlt.length
        ? `Add alt text to ${missingAlt.length} ${missingAlt.length === 1 ? "photo" : "photos"}`
        : "Photos have alt text",
      // Opens the first block whose photo needs alt text.
      fix: missingAlt[0] ? () => builder.select(missingAlt[0].id) : undefined,
    },
  ];
  const left = checks.filter((item) => !item.ok).length;

  return (
    <div className="flex flex-col gap-5 p-5">
      <div
        role="status"
        className={cn(
          "flex items-center gap-3 rounded-xl p-3.5",
          left ? "bg-office-tint-orange" : "bg-office-tint-teal",
        )}
      >
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full text-white",
            left ? "bg-office-ink-orange" : "bg-office-primary",
          )}
        >
          {left ? (
            <AlertTriangle aria-hidden="true" className="size-5" />
          ) : (
            <Check aria-hidden="true" className="size-5" strokeWidth={2.5} />
          )}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-office-icon">
            {left
              ? `Almost ready: ${left} ${left === 1 ? "thing" : "things"} to check`
              : "Your page is ready"}
          </p>
          <p
            className={cn(
              "truncate text-xs",
              left ? "text-office-ink-orange" : "text-office-primary",
            )}
          >
            {page.name} ·{" "}
            {builder.lastSaved
              ? `last saved ${timeAgo(builder.lastSaved).toLowerCase()}`
              : "no changes yet"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-office-icon">Page Summary</h2>
        <button
          type="button"
          onClick={() => builder.select(PAGE_SETTINGS_SELECTION)}
          className="focus-ring inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-office-primary hover:underline"
        >
          <Settings aria-hidden="true" className="size-4" />
          Page settings
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-2.5">
        <Stat label="Sections" value={String(page.blocks.length)} />
        <Stat label="Photos" value={String(photos.length)} />
        <Stat
          label="Est. load time"
          value={`${seconds.toFixed(1)}s`}
          note={speed}
          tone={
            speed === "Fast" ? "good" : speed === "Moderate" ? "warn" : "bad"
          }
          wide
        />
      </dl>

      <section
        aria-labelledby="before-publish"
        className="border-t border-office-meter-track pt-5"
      >
        <h3
          id="before-publish"
          className="text-sm font-semibold text-office-icon"
        >
          Before you publish
        </h3>
        <ul className="mt-3 flex flex-col gap-2.5">
          {checks.map((item) => (
            <li key={item.text} className="flex items-start gap-2.5 text-sm">
              {item.ok ? (
                <CircleCheck
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-office-primary"
                />
              ) : (
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-office-ink-orange"
                />
              )}
              {item.fix ? (
                <button
                  type="button"
                  onClick={item.fix}
                  className="focus-ring rounded text-left text-office-ink-orange underline-offset-2 hover:underline"
                >
                  {item.text}
                </button>
              ) : (
                <span
                  className={
                    item.ok ? "text-office-icon" : "text-office-ink-orange"
                  }
                >
                  {item.text}
                  <span className="sr-only">
                    {item.ok ? " (done)" : " (to do)"}
                  </span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-2.5">
        <Button
          type="button"
          variant="outline"
          onClick={onPreview}
          className="h-11 gap-2 border-office-meter-track bg-card font-semibold text-office-icon hover:bg-office-chip"
        >
          <Eye aria-hidden="true" className="size-4" />
          Preview site
        </Button>
        <Button asChild variant="office" className="h-11 font-semibold">
          <Link href={reviewHref}>Review &amp; publish</Link>
        </Button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  tone,
  wide,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "good" | "warn" | "bad";
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-office-meter-track p-3",
        wide && "col-span-2",
      )}
    >
      {/* Label first for screen readers; shown under the value. */}
      <dt className="order-2 text-xs text-office-muted">{label}</dt>
      <dd className="order-1 text-xl font-bold text-office-icon">{value}</dd>
      {note ? (
        <dd
          className={cn(
            "order-3 text-xs font-medium",
            tone === "good" && "text-office-success-text",
            tone === "warn" && "text-office-ink-orange",
            tone === "bad" && "text-office-danger-text",
          )}
        >
          {note}
        </dd>
      ) : null}
    </div>
  );
}
