"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import {
  ArrowRight,
  ArrowUp,
  CalendarCheck,
  Check,
  Ellipsis,
  Eye,
  Globe,
  Info,
  Pencil,
  QrCode,
  Search,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/features/reports";
import { formatPercent } from "@/lib/format/numbers";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import type { WebsiteAnalytics } from "../server/website-analytics";
import { ScratchSiteCanvas, useScratchSite } from "./builder/scratch-site";
import { ScaledScreen } from "./device-frame";
import { PreviewSite, siteAddress, siteContent } from "./preview-site";
import { SCRATCH_PATH } from "./scratch-steps";
import { DRAFT_KEYS, useStepSavedAt, useTemplateDraft } from "./template-draft";
import { formCardClass } from "./template-fields";
import { timeAgo, useTemplateStatus } from "./template-status";
import { TEMPLATE_STEPS } from "./template-steps";
import { VisitorsChart } from "./visitors-chart";
import { WebsitePagesTable, type PageRow } from "./website-pages-table";

const FORM_PATH = `${COMPANY_PATHS.website}/template-form`;
const REVIEW_PATH = `${FORM_PATH}/review`;

type StepKey = Exclude<
  keyof typeof DRAFT_KEYS,
  "publish" | "scratch" | "scratchSite" | "assistance"
>;

// Template step for each step key (index into TEMPLATE_STEPS).
const STEP_INDEX: Record<StepKey, number> = {
  hotel: 1,
  brand: 2,
  rooms: 3,
  facilities: 4,
  policies: 5,
  contact: 6,
};

// Which step's answers fill each menu page.
const PAGE_STEPS: Record<string, StepKey> = {
  Home: "hotel",
  Rooms: "rooms",
  Booking: "policies",
  Gallery: "facilities",
  Reviews: "facilities",
  Contact: "contact",
  Offers: "contact",
  Blog: "contact",
  "Things to do": "facilities",
};

// Where the dashboard's buttons go for the published kind of site.
type SiteLinks = {
  edit: string;
  view: string;
  review: string;
  publish: string;
  published: string;
  booking: string;
  addPage: string;
};

type PublishState = {
  title: string;
  description: string;
  publishedAt: string | null;
  source?: "template" | "scratch";
};

type WebsiteDashboardProps = {
  analytics: WebsiteAnalytics;
  hotelName: string;
  city: string;
  country: string;
};

// Website Builder home once the site is published: status, unpublished
// changes, traffic, pages and quick actions.
export function WebsiteDashboard({
  analytics,
  hotelName,
  city,
  country,
}: WebsiteDashboardProps) {
  const router = useRouter();
  const status = useTemplateStatus();
  const publish = useTemplateDraft<PublishState>(DRAFT_KEYS.publish, {
    title: "",
    description: "",
    publishedAt: null,
  });
  const savedAt: Record<StepKey, Date | null> = {
    hotel: useStepSavedAt(DRAFT_KEYS.hotel),
    brand: useStepSavedAt(DRAFT_KEYS.brand),
    rooms: useStepSavedAt(DRAFT_KEYS.rooms),
    facilities: useStepSavedAt(DRAFT_KEYS.facilities),
    policies: useStepSavedAt(DRAFT_KEYS.policies),
    contact: useStepSavedAt(DRAFT_KEYS.contact),
  };

  const publishedAt = publish.values.publishedAt
    ? new Date(publish.values.publishedAt)
    : null;
  const content = siteContent(status, { hotelName, city, country });
  const scratchSite = useScratchSite(hotelName);
  // The published site: the hotel template or a site built from scratch.
  const scratch = publish.values.source === "scratch";
  const name = scratch ? scratchSite.name : (content.hotel.name ?? hotelName);
  const address = scratch
    ? scratchSite.address
    : siteAddress(name, status.hotel?.type);
  const links: SiteLinks = scratch
    ? {
        edit: `${SCRATCH_PATH}/builder`,
        view: `${SCRATCH_PATH}/preview`,
        review: `${SCRATCH_PATH}/review`,
        publish: `${SCRATCH_PATH}/publish`,
        published: `${SCRATCH_PATH}/published`,
        booking: `${SCRATCH_PATH}/builder`,
        addPage: `${SCRATCH_PATH}/builder`,
      }
    : {
        edit: REVIEW_PATH,
        view: `${COMPANY_PATHS.website}/preview`,
        review: REVIEW_PATH,
        publish: `${COMPANY_PATHS.website}/publish`,
        published: `${COMPANY_PATHS.website}/published`,
        booking: TEMPLATE_STEPS[STEP_INDEX.policies].href ?? REVIEW_PATH,
        addPage: TEMPLATE_STEPS[STEP_INDEX.contact].href ?? REVIEW_PATH,
      };

  // Steps saved after the last publish, and the menu pages they change.
  const changed = (Object.keys(STEP_INDEX) as StepKey[]).filter(
    (key) => publishedAt && savedAt[key] && savedAt[key] > publishedAt,
  );
  const scratchPages = scratchSite.builder.site.pages;
  const scratchChanged = Boolean(
    publishedAt && scratchSite.savedAt && scratchSite.savedAt > publishedAt,
  );
  const changedPages = scratch
    ? scratchChanged
      ? scratchPages.map((page) => page.name)
      : []
    : changed.includes("brand")
      ? status.menuPages
      : status.menuPages.filter((page) =>
          changed.includes(PAGE_STEPS[page] ?? "contact"),
        );
  const latestChange = scratch
    ? scratchChanged
      ? scratchSite.savedAt
      : null
    : changed.reduce<Date | null>((latest, key) => {
        const at = savedAt[key];
        return at && (!latest || at > latest) ? at : latest;
      }, null);
  const pageCount = scratch ? scratchPages.length : status.menuPages.length;

  const templatePages: PageRow[] = status.menuPages.map((page) => {
    const step = PAGE_STEPS[page] ?? "contact";
    return {
      name: page,
      path:
        page === "Home" ? "/" : `/${page.toLowerCase().replace(/\s+/g, "-")}`,
      changed: changedPages.includes(page),
      views: analytics.pageViews[page] ?? 0,
      lastEdited: savedAt[step] ?? publishedAt,
      editHref: TEMPLATE_STEPS[STEP_INDEX[step]].href ?? REVIEW_PATH,
    };
  });
  const pages: PageRow[] = scratch
    ? scratchPages.map((page) => ({
        name: page.name,
        path: page.path,
        changed: scratchChanged,
        views: analytics.pageViews[page.name] ?? 0,
        lastEdited: scratchSite.savedAt ?? publishedAt,
        editHref: `${SCRATCH_PATH}/builder`,
      }))
    : templatePages;

  function publishChanges() {
    const ready = scratch ? scratchPages[0].blocks.length > 0 : status.ready;
    if (!ready) {
      router.push(links.review);
      return;
    }
    // TODO: send the site to the publishing service once it exists.
    publish.save({
      publishedAt: new Date().toISOString(),
      source: scratch ? "scratch" : "template",
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <section
        aria-labelledby="my-website-title"
        className={cn(
          formCardClass,
          "flex flex-col gap-6 lg:flex-row lg:items-center",
        )}
      >
        <div className="min-w-0 flex-1">
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
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold text-office-primary">
              <Globe aria-hidden="true" className="size-4" />
              {address}
            </span>
            {publishedAt ? (
              <span className="text-office-muted">
                · Published {formatPublished(publishedAt)}
              </span>
            ) : null}
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Button
              asChild
              variant="office"
              className="h-11 gap-2 px-5 font-semibold"
            >
              <Link href={links.edit}>
                <Pencil aria-hidden="true" className="size-4" />
                Edit website
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 gap-2 border-office-meter-track bg-card px-5 font-semibold text-office-icon hover:bg-office-chip"
            >
              <Link href={links.view}>
                <Eye aria-hidden="true" className="size-4" />
                View site
              </Link>
            </Button>
            <MoreMenu url={`https://${address}/`} links={links} />
          </div>
        </div>

        <SiteHealth health={analytics.health} />

        <div
          aria-hidden="true"
          inert
          className="hidden w-full max-w-72 shrink-0 overflow-hidden rounded-xl border border-office-meter-track bg-white shadow-lg sm:block lg:w-72"
        >
          <div className="flex h-5 items-center gap-1 bg-[#eef1f4] px-2">
            <span className="size-1.5 rounded-full bg-[#ff5f57]" />
            <span className="size-1.5 rounded-full bg-[#febc2e]" />
            <span className="size-1.5 rounded-full bg-[#28c840]" />
          </div>
          <ScaledScreen device="desktop" height={560}>
            {scratch ? (
              <ScratchSiteCanvas site={scratchSite} scroll={false} />
            ) : (
              <PreviewSite content={content} idPrefix="dashboard-thumb" />
            )}
          </ScaledScreen>
        </div>
      </section>

      {changedPages.length ? (
        <div
          role="status"
          className="flex flex-col gap-4 rounded-2xl border border-office-ink-orange/25 bg-office-tint-orange px-5 py-4 sm:flex-row sm:items-center"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-office-ink-orange/40 text-office-ink-orange">
            <Info aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#8a4a06]">
              You have unpublished changes{" "}
              {scratch
                ? "to your website"
                : changesWhere(changedPages, pageCount)}
            </p>
            {latestChange ? (
              <p className="text-xs text-[#8a4a06]/80">
                Edited {timeAgo(latestChange)}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-2.5">
            <Button
              asChild
              variant="outline"
              className="h-10 border-office-meter-track bg-card px-4 font-semibold text-office-icon hover:bg-office-chip"
            >
              <Link href={links.review}>Review changes</Link>
            </Button>
            <Button
              type="button"
              variant="office"
              onClick={publishChanges}
              className="h-10 gap-2 px-4 font-semibold"
            >
              Publish changes
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <KpiCard
          icon={Users}
          label="Visitors"
          value={sum(analytics.visitors.days)}
          change={analytics.visitors.change}
          trend={analytics.visitors.days.map((day) => day.count)}
        />
        <KpiCard
          icon={CalendarCheck}
          label="Booking clicks"
          value={sum(analytics.bookingClicks.days)}
          change={analytics.bookingClicks.change}
          trend={analytics.bookingClicks.days.map((day) => day.count)}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <VisitorsChart days={analytics.visitors.days} />
        <TrafficCard
          sources={analytics.trafficSources}
          devices={analytics.devices}
        />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <WebsitePagesTable pages={pages} addHref={links.addPage} />
        <QuickActions
          address={address}
          bookingLive={
            scratch
              ? scratchPages.some((page) =>
                  page.blocks.some((block) => block.type === "booking"),
                )
              : status.policies?.bookingMode !== "contact"
          }
          links={links}
          onUnpublish={() => publish.save({ publishedAt: null })}
        />
      </div>
    </div>
  );
}

function SiteHealth({ health }: { health: WebsiteAnalytics["health"] }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="shrink-0 rounded-xl border border-office-meter-track bg-office-chip/50 p-4 lg:w-52">
      <div className="flex items-center gap-3">
        <svg
          viewBox="0 0 64 64"
          role="img"
          aria-label={`Site health ${health.score} out of 100`}
          className="size-16"
        >
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            strokeWidth="7"
            className="stroke-office-meter-track"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${(health.score / 100) * circumference} ${circumference}`}
            transform="rotate(-90 32 32)"
            className="stroke-office-primary"
          />
        </svg>
        <div>
          <p aria-hidden="true" className="text-2xl font-bold text-office-icon">
            {health.score}
          </p>
          <p className="text-xs text-office-muted">Site health</p>
        </div>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5">
        {health.checks.map((check) => (
          <li
            key={check.label}
            className="flex items-center gap-2 text-xs text-office-icon"
          >
            <Check
              aria-hidden="true"
              className={cn(
                "size-3.5",
                check.passed ? "text-office-primary" : "text-office-muted/50",
              )}
              strokeWidth={2.5}
            />
            {check.label}
            {check.passed ? null : (
              <span className="sr-only"> (needs attention)</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MoreMenu({ url, links }: { url: string; links: SiteLinks }) {
  const [copied, setCopied] = useState(false);
  const itemClass =
    "flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-sm text-office-icon outline-none data-highlighted:bg-office-nav-active";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label="More website actions"
        className="focus-ring inline-flex size-11 items-center justify-center rounded-lg border border-office-meter-track bg-card text-office-icon hover:bg-office-chip"
      >
        <Ellipsis aria-hidden="true" className="size-5" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 min-w-52 rounded-xl border border-border bg-popover p-1.5 shadow-lg"
        >
          <DropdownMenu.Item
            className={itemClass}
            onSelect={(event) => {
              event.preventDefault();
              navigator.clipboard
                ?.writeText(url)
                .then(() => setCopied(true))
                .catch(() => setCopied(false));
            }}
          >
            {copied ? (
              <Check aria-hidden="true" className="size-4" />
            ) : (
              <Globe aria-hidden="true" className="size-4" />
            )}
            {copied ? "Link copied" : "Copy link"}
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={itemClass}>
            <Link href={links.published}>
              <QrCode aria-hidden="true" className="size-4" />
              Share &amp; QR code
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={itemClass}>
            <Link href={links.publish}>
              <Search aria-hidden="true" className="size-4" />
              Publish settings
            </Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  change,
  trend,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  change: number;
  trend: number[];
}) {
  const up = change >= 0;
  return (
    <section className={cn(formCardClass, "flex flex-col gap-3")}>
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-office-tint-teal text-office-primary">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <h2 className="flex-1 text-sm font-medium text-office-icon">{label}</h2>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
            up
              ? "bg-office-success-soft text-office-success-text"
              : "bg-office-danger-soft text-office-danger-text",
          )}
        >
          <ArrowUp
            aria-hidden="true"
            className={cn("size-3", !up && "rotate-180")}
          />
          <span className="sr-only">{up ? "Up" : "Down"} </span>
          {formatPercent(Math.abs(change), 0)}
        </span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-bold text-office-icon">
            {value.toLocaleString("en-US")}
          </p>
          <p className="text-xs text-office-muted">vs last 30 days</p>
        </div>
        <Sparkline
          values={trend}
          label={`${label} trend over the last 30 days`}
          className="max-w-36"
        />
      </div>
    </section>
  );
}

function TrafficCard({
  sources,
  devices,
}: {
  sources: WebsiteAnalytics["trafficSources"];
  devices: WebsiteAnalytics["devices"];
}) {
  const sourceColors = [
    "bg-office-primary",
    "bg-office-chart-bright",
    "bg-[#5ddfc8]",
    "bg-office-meter-track",
  ];
  const deviceColors: Record<string, string> = {
    Mobile: "bg-office-primary",
    Desktop: "bg-office-chart-bright",
    Tablet: "bg-office-meter-track",
  };
  return (
    <section aria-labelledby="traffic-title" className={formCardClass}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="traffic-title" className="font-semibold text-office-icon">
          Traffic sources
        </h2>
        <span className="text-xs text-office-muted">Last 30 days</span>
      </div>
      <ul className="mt-4 flex flex-col gap-3.5">
        {sources.map((source, index) => (
          <li key={source.label}>
            <div className="flex justify-between text-sm">
              <span className="text-office-icon">{source.label}</span>
              <span className="font-semibold text-office-icon">
                {formatPercent(source.share, 0)}
              </span>
            </div>
            <div
              aria-hidden="true"
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-office-chip"
            >
              <div
                className={cn(
                  "h-full rounded-full",
                  sourceColors[index % sourceColors.length],
                )}
                style={{ width: `${source.share * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <h3 className="mt-6 text-sm font-semibold text-office-icon">Devices</h3>
      <div aria-hidden="true" className="mt-2 flex h-2.5 gap-1">
        {devices.map((device) => (
          <span
            key={device.label}
            className={cn("rounded-full", deviceColors[device.label])}
            style={{ width: `${device.share * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
        {devices.map((device) => (
          <li
            key={device.label}
            className="flex items-center gap-1.5 text-xs text-office-muted"
          >
            <span
              aria-hidden="true"
              className={cn("size-2 rounded-full", deviceColors[device.label])}
            />
            {device.label} {formatPercent(device.share, 0)}
          </li>
        ))}
      </ul>
    </section>
  );
}

function QuickActions({
  address,
  bookingLive,
  links,
  onUnpublish,
}: {
  address: string;
  bookingLive: boolean;
  links: SiteLinks;
  onUnpublish: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <section aria-labelledby="quick-actions-title" className={formCardClass}>
      <h2 id="quick-actions-title" className="font-semibold text-office-icon">
        Quick actions
      </h2>
      <ul className="mt-4 grid grid-cols-2 gap-3">
        <QuickAction icon={Globe} title="Domain" href={links.publish}>
          {address}
        </QuickAction>
        <QuickAction
          icon={Search}
          title="Search & sharing"
          href={links.publish}
        >
          SEO and social preview
        </QuickAction>
        <QuickAction icon={Zap} title="Booking engine" href={links.booking}>
          {bookingLive
            ? "Live · accepting bookings"
            : "Off · guests contact you"}
        </QuickAction>
        <QuickAction
          icon={QrCode}
          title="Share & QR code"
          href={links.published}
        >
          Link, QR code, WhatsApp
        </QuickAction>
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-office-danger/20 bg-office-danger-soft p-3.5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-office-icon">
            Website visibility
          </p>
          <p id="unpublish-note" className="text-xs text-office-muted">
            {confirming
              ? "Guests will no longer see your website."
              : "Unpublish to hide it from guests."}
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
              onClick={onUnpublish}
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

function QuickAction({
  icon: Icon,
  title,
  href,
  children,
}: {
  icon: LucideIcon;
  title: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="focus-ring flex h-full flex-col gap-2 rounded-xl border border-office-meter-track bg-office-chip/40 p-3.5 transition-colors hover:border-brand-cyan/60 hover:bg-[#f8fcfd]"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-card text-office-primary shadow-sm">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <span className="text-sm font-semibold text-office-icon">{title}</span>
        <span className="text-xs break-all text-office-muted">{children}</span>
      </Link>
    </li>
  );
}

function sum(days: { count: number }[]) {
  return days.reduce((total, day) => total + day.count, 0);
}

// "on the Rooms page", "on the Rooms and Contact pages", "on 4 pages", "on all pages"
function changesWhere(pages: string[], total: number) {
  if (pages.length === total && total > 2) return "on all pages";
  if (pages.length === 1) return `on the ${pages[0]} page`;
  if (pages.length === 2) return `on the ${pages[0]} and ${pages[1]} pages`;
  return `on ${pages.length} pages`;
}

function formatPublished(date: Date) {
  const day = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day}, ${time}`;
}
