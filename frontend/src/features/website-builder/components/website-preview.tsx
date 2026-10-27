"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  Monitor,
  Smartphone,
  Tablet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { ScratchSiteCanvas, useScratchSite } from "./builder/scratch-site";
import { DeviceFrame, type Device } from "./device-frame";
import { PreviewSite, siteAddress, siteContent } from "./preview-site";
import { SCRATCH_PATH } from "./scratch-steps";
import { useTemplateStatus } from "./template-status";

const REVIEW_PATH = `${COMPANY_PATHS.website}/template-form/review`;

const DEVICES: { value: Device; label: string; icon: LucideIcon }[] = [
  { value: "desktop", label: "Desktop", icon: Monitor },
  { value: "tablet", label: "Tablet", icon: Tablet },
  { value: "mobile", label: "Mobile", icon: Smartphone },
];

type WebsitePreviewProps = {
  // From the property record, for drafts that were never saved.
  hotelName: string;
  city: string;
  country: string;
};

// Full-screen preview of the template site on desktop, tablet and mobile.
export function WebsitePreview({
  hotelName,
  city,
  country,
}: WebsitePreviewProps) {
  const status = useTemplateStatus();
  const { hotel, brand, rooms, facilities, policies, contact } = status;
  const missing = [hotel, brand, rooms, facilities, policies, contact].some(
    (draft) => !draft,
  );
  const name = hotel?.name?.trim() || hotelName;

  return (
    <PreviewShell
      domain={siteAddress(name, hotel?.type)}
      back={{ href: REVIEW_PATH, label: "Back to review" }}
      edit={{ href: REVIEW_PATH, label: "Edit my details" }}
      publishHref={`${COMPANY_PATHS.website}/publish`}
      notice={
        missing
          ? "Some steps are not saved yet, so parts of the preview use placeholders."
          : null
      }
    >
      <PreviewSite
        content={siteContent(status, { hotelName, city, country })}
      />
    </PreviewShell>
  );
}

// The same preview for a site built from scratch (its pages and blocks).
export function ScratchWebsitePreview({ hotelName }: { hotelName: string }) {
  const site = useScratchSite(hotelName);
  const empty = !site.builder.site.pages[0].blocks.length;

  return (
    <PreviewShell
      domain={site.address}
      back={{ href: `${SCRATCH_PATH}/review`, label: "Back to review" }}
      edit={{ href: `${SCRATCH_PATH}/builder`, label: "Edit in builder" }}
      publishHref={`${SCRATCH_PATH}/publish`}
      notice={
        empty
          ? "Your Home page has no sections yet. Add some in the builder."
          : null
      }
    >
      <ScratchSiteCanvas site={site} />
    </PreviewShell>
  );
}

type PreviewShellProps = {
  domain: string;
  back: { href: string; label: string };
  edit: { href: string; label: string };
  publishHref: string;
  notice: string | null;
  // The site, laid out at the device's width.
  children: ReactNode;
};

function PreviewShell({
  domain,
  back,
  edit,
  publishHref,
  notice,
  children,
}: PreviewShellProps) {
  const [device, setDevice] = useState<Device>("desktop");

  return (
    <div className="relative isolate flex min-h-dvh flex-1 flex-col overflow-hidden bg-[#f4f9fb]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 -z-10 size-[32rem] rounded-full bg-office-chart-fill blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -left-40 -z-10 size-[30rem] rounded-full bg-office-chart-fill/70 blur-3xl"
      />

      <header className="sticky top-0 z-30 border-b border-office-meter-track bg-white/90 backdrop-blur print:hidden">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:px-8">
          <Link
            href={back.href}
            className="focus-ring inline-flex shrink-0 items-center gap-1 rounded-md text-sm font-medium text-office-primary hover:underline"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            {back.label}
          </Link>
          <span
            aria-hidden="true"
            className="hidden h-8 w-px bg-office-meter-track sm:block"
          />
          <div className="min-w-0">
            <h1 className="font-semibold text-office-icon">
              Preview Your Website
            </h1>
            <p className="truncate text-xs text-office-muted">
              {domain} · Not published yet
            </p>
          </div>

          <div
            role="radiogroup"
            aria-label="Preview device"
            className="order-last mx-auto flex w-full justify-center gap-1 rounded-xl border border-office-meter-track bg-card p-1 sm:w-auto lg:order-none"
          >
            {DEVICES.map(({ value, label, icon: Icon }) => {
              const on = device === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setDevice(value)}
                  className={cn(
                    "focus-ring inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors sm:flex-none",
                    on
                      ? "border-brand-cyan/60 bg-office-tint-teal text-office-primary"
                      : "border-transparent text-office-icon hover:bg-office-chip",
                  )}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {label}
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
            <Button
              asChild
              variant="outline"
              className="h-10 border-office-meter-track bg-card px-4 text-sm font-semibold text-office-icon hover:bg-office-chip"
            >
              <Link href={edit.href}>{edit.label}</Link>
            </Button>
            <Button
              asChild
              variant="office"
              className="h-10 gap-2 px-4 text-sm font-semibold"
            >
              <Link href={publishHref}>
                Continue to publish
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 flex-col items-center px-4 py-8 outline-none sm:px-8"
      >
        {notice ? (
          <p className="mb-6 flex max-w-2xl items-center gap-2 rounded-lg bg-office-tint-orange px-4 py-2.5 text-sm font-medium text-office-ink-orange">
            <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
            {notice}
          </p>
        ) : null}
        <div className="flex w-full flex-1 items-center justify-center">
          <DeviceFrame device={device} url={domain}>
            {children}
          </DeviceFrame>
        </div>
      </main>
    </div>
  );
}
