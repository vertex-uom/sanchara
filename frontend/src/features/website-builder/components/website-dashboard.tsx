"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, Check, Copy, Eye, Globe, Pencil } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { useScratchSite } from "./builder/scratch-site";
import { siteAddress, siteContent } from "./preview-site";
import { SCRATCH_PATH } from "./scratch-steps";
import { DRAFT_KEYS, useTemplateDraft } from "./template-draft";
import { formCardClass } from "./template-fields";
import { useTemplateStatus } from "./template-status";

type PublishState = {
  title: string;
  description: string;
  publishedAt: string | null;
  source?: "template" | "scratch";
};

type WebsiteDashboardProps = {
  hotelName: string;
  city: string;
  country: string;
};

// Website Builder home once the site is published: its address, when it
// was published, and edit, view and unpublish.
export function WebsiteDashboard({
  hotelName,
  city,
  country,
}: WebsiteDashboardProps) {
  const status = useTemplateStatus();
  const publish = useTemplateDraft<PublishState>(DRAFT_KEYS.publish, {
    title: "",
    description: "",
    publishedAt: null,
  });
  const scratchSite = useScratchSite(hotelName);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const publishedAt = publish.values.publishedAt
    ? new Date(publish.values.publishedAt)
    : null;
  // The published site: the hotel template or a site built from scratch.
  const scratch = publish.values.source === "scratch";
  const content = siteContent(status, { hotelName, city, country });
  const address = scratch
    ? scratchSite.address
    : siteAddress(content.hotel.name ?? hotelName, status.hotel?.type);
  const url = `https://${address}/`;
  const editHref = scratch
    ? `${SCRATCH_PATH}/builder`
    : `${COMPANY_PATHS.website}/template-form/review`;
  const viewHref = scratch
    ? `${SCRATCH_PATH}/preview`
    : `${COMPANY_PATHS.website}/preview`;

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function unpublish() {
    // TODO: take the site offline with the publishing service once it exists.
    publish.save({ publishedAt: null });
  }

  return (
    <section
      aria-labelledby="my-website-title"
      className={cn(formCardClass, "mx-auto w-full max-w-3xl")}
    >
      <p className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-office-success-soft px-2 py-0.5 text-xs font-semibold text-office-success-text">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-office-success-dot"
          />
          Live
        </span>
        <span className="text-xs font-semibold tracking-[0.14em] text-office-muted uppercase">
          Website
        </span>
      </p>
      <h1
        id="my-website-title"
        className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
      >
        My Website
      </h1>

      <dl className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <dt className="text-xs font-semibold tracking-wide text-office-muted uppercase">
            Website URL
          </dt>
          <dd className="flex flex-wrap items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex min-w-0 items-center gap-1.5 rounded font-semibold break-all text-office-primary hover:underline"
            >
              <Globe aria-hidden="true" className="size-4 shrink-0" />
              {address}
            </a>
            <button
              type="button"
              onClick={copyUrl}
              aria-label={copied ? "Link copied" : `Copy ${address}`}
              className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-md border border-office-meter-track bg-card px-2.5 text-xs font-semibold text-office-icon hover:bg-office-chip"
            >
              {copied ? (
                <Check aria-hidden="true" className="size-3.5" />
              ) : (
                <Copy aria-hidden="true" className="size-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </dd>
        </div>
        <div className="flex flex-col gap-1.5">
          <dt className="text-xs font-semibold tracking-wide text-office-muted uppercase">
            Published
          </dt>
          <dd className="inline-flex items-center gap-1.5 text-sm font-semibold text-office-icon">
            <CalendarClock
              aria-hidden="true"
              className="size-4 text-office-primary"
            />
            {publishedAt ? formatPublished(publishedAt) : "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap gap-2.5">
        <Button
          asChild
          variant="office"
          className="h-11 gap-2 px-5 font-semibold"
        >
          <Link href={editHref}>
            <Pencil aria-hidden="true" className="size-4" />
            Edit website
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-11 gap-2 border-office-meter-track bg-card px-5 font-semibold text-office-icon hover:bg-office-chip"
        >
          <Link href={viewHref}>
            <Eye aria-hidden="true" className="size-4" />
            View website
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-office-danger/20 bg-office-danger-soft p-3.5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-office-icon">
            Website visibility
          </p>
          <p id="unpublish-note" className="text-xs text-office-muted">
            {confirming
              ? "Guests will no longer see your website."
              : "Unpublish to hide it from guests. You can publish it again later."}
          </p>
        </div>
        {confirming ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirming(false)}
              className="h-9 border-office-meter-track bg-card px-3 text-sm font-semibold text-office-icon"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="office-danger"
              onClick={unpublish}
              aria-describedby="unpublish-note"
              className="h-9 px-3 text-sm font-semibold"
            >
              Unpublish
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirming(true)}
            className="h-9 border-office-danger/40 bg-card px-3 text-sm font-semibold text-office-danger-text hover:bg-office-danger-soft"
          >
            Unpublish
          </Button>
        )}
      </div>
    </section>
  );
}

// "27 Oct 2026, 2:30 PM".
function formatPublished(date: Date) {
  const day = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day}, ${time}`;
}
