"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CircleCheck,
  CloudUpload,
  Crown,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { LocalThumbnail } from "./local-thumbnail";
import { useScratchSite } from "./builder/scratch-site";
import { siteAddress } from "./preview-site";
import { SCRATCH_PATH, SCRATCH_STEPS } from "./scratch-steps";
import { DRAFT_KEYS, useTemplateDraft } from "./template-draft";
import { Field, formCardClass, inputClass } from "./template-fields";
import { timeAgo, useTemplateStatus } from "./template-status";
import { FORM_STEP_COUNT } from "./template-steps";

const REVIEW_PATH = `${COMPANY_PATHS.website}/template-form/review`;
const PREVIEW_PATH = `${COMPANY_PATHS.website}/preview`;
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;

// The template flow condensed to five stops, as the publish design shows it.
const TEMPLATE_STOPS = [
  "Choose method",
  "Hotel details",
  "Rooms & policies",
  "Review",
  "Publish",
];

export type PublishSource = "template" | "scratch";

type PublishSettingsDraft = {
  title: string;
  description: string;
  // When Publish was last pressed; null until then.
  publishedAt: string | null;
  // Which site was published: the hotel template or the scratch build.
  source?: PublishSource;
};

type PublishSettingsProps = {
  // From the property record, for drafts that were never saved.
  hotelName: string;
  city: string;
};

// Last step of the hotel template: web address, search & sharing text,
// then publish.
export function PublishSettings({ hotelName, city }: PublishSettingsProps) {
  const status = useTemplateStatus();
  const name = status.hotel?.name?.trim() || hotelName;
  const town = status.contact?.city?.trim() || city;
  const left = FORM_STEP_COUNT - status.done;
  return (
    <PublishView
      source="template"
      name={name}
      address={siteAddress(name, status.hotel?.type)}
      logo={status.images.logo}
      defaults={{
        title: town ? `${name} | Stay in ${town}` : name,
        description: status.hotel?.description ?? "",
      }}
      blocker={
        status.ready
          ? null
          : `${left} ${left === 1 ? "step is" : "steps are"} not finished. Complete them on the review page first.`
      }
      reviewHref={REVIEW_PATH}
      previewHref={PREVIEW_PATH}
      stops={TEMPLATE_STOPS}
      template="Sanchara Hotel Template"
      pages={status.menuPages.length}
      lastSaved={status.lastSaved}
    />
  );
}

// The same step for a site built from scratch.
export function ScratchPublishSettings({
  hotelName,
  city,
}: PublishSettingsProps) {
  const site = useScratchSite(hotelName);
  const home = site.builder.site.pages[0];
  const hero = home.blocks.find((block) => block.type === "hero");
  return (
    <PublishView
      source="scratch"
      name={site.name}
      address={site.address}
      logo={site.logo}
      defaults={{
        title: city ? `${site.name} | Stay in ${city}` : site.name,
        description: hero?.props.subtitle || site.tagline,
      }}
      blocker={
        home.blocks.length
          ? null
          : "Your Home page has no sections yet. Add some in the builder first."
      }
      reviewHref={`${SCRATCH_PATH}/review`}
      previewHref={`${SCRATCH_PATH}/preview`}
      stops={SCRATCH_STEPS.map((step) => step.label)}
      template="Custom design"
      pages={site.builder.site.pages.length}
      lastSaved={site.savedAt}
    />
  );
}

type PublishViewProps = {
  source: PublishSource;
  name: string;
  address: string;
  logo: File | null;
  // Search title and description before any are saved.
  defaults: { title: string; description: string };
  // Why the site cannot be published yet; null when it can.
  blocker: string | null;
  reviewHref: string;
  previewHref: string;
  // Steps of the flow for the progress bar (the last is Publish).
  stops: string[];
  template: string;
  pages: number;
  lastSaved: Date | null;
};

function PublishView({
  source,
  name,
  address,
  logo,
  defaults,
  blocker,
  reviewHref,
  previewHref,
  stops,
  template,
  pages,
  lastSaved,
}: PublishViewProps) {
  const router = useRouter();
  const { values, update, save } = useTemplateDraft<PublishSettingsDraft>(
    DRAFT_KEYS.publish,
    {
      title: defaults.title,
      description: defaults.description.slice(0, DESCRIPTION_MAX),
      publishedAt: null,
    },
  );
  const [problem, setProblem] = useState<string | null>(null);

  function publish() {
    if (blocker) {
      setProblem(blocker);
      return;
    }
    if (!values.title.trim() || !values.description.trim()) {
      setProblem("Add a site title and description for search results.");
      return;
    }
    setProblem(null);
    // TODO: send the site to the publishing service once it exists.
    save({ publishedAt: new Date().toISOString(), source });
    router.push(
      source === "scratch"
        ? `${SCRATCH_PATH}/published`
        : `${COMPANY_PATHS.website}/published`,
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={previewHref}
        className="focus-ring inline-flex items-center gap-2 self-start rounded-md text-sm font-medium text-office-primary hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to preview
      </Link>

      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Publish Settings
          </h1>
          <p className="mt-2 text-sm text-office-muted sm:text-base">
            Choose your web address and how your website appears in search
            results.
          </p>
        </div>
        <Stepper stops={stops} />
      </div>

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <section aria-labelledby="address-title" className={formCardClass}>
            <h2
              id="address-title"
              className="text-lg font-semibold text-office-icon"
            >
              Website Address
            </h2>
            <p className="mt-1 text-sm text-office-muted">
              Where guests will find your website.
            </p>
            <fieldset className="mt-5 flex flex-col gap-3">
              <legend className="sr-only">Website address</legend>
              <AddressOption
                title="Custom domain"
                description="Use your own domain name for a professional look."
                badge={<Badge tone="premium">Premium</Badge>}
                disabled
              >
                <label htmlFor="custom-domain" className="sr-only">
                  Custom domain
                </label>
                <div className="mt-3 flex h-11 items-center gap-2 rounded-lg border border-office-meter-track bg-card px-3.5 text-sm text-office-muted/70">
                  <span>https://</span>
                  <input
                    id="custom-domain"
                    disabled
                    placeholder={`${siteAddress(name).split(".")[0]}.com`}
                    aria-describedby="custom-domain-note"
                    className="w-full min-w-0 cursor-not-allowed bg-transparent outline-none placeholder:text-office-muted/70"
                  />
                </div>
                <p
                  id="custom-domain-note"
                  className="mt-3 text-xs text-office-muted"
                >
                  Custom domains are available on the Premium plan only.
                </p>
                <Button
                  asChild
                  variant="office"
                  className="mt-3 h-10 gap-2 px-4 text-sm font-semibold"
                >
                  <Link href={COMPANY_PATHS.subscription}>
                    <Crown aria-hidden="true" className="size-4" />
                    Upgrade to Premium
                  </Link>
                </Button>
              </AddressOption>
              <AddressOption
                title="Free Sanchara address"
                description="Get started for free. You can connect a domain later."
                badge={<Badge tone="free">Free</Badge>}
                checked
              >
                <p className="mt-2 text-sm font-medium text-office-icon">
                  {address}
                </p>
              </AddressOption>
            </fieldset>
          </section>

          <section aria-labelledby="search-title" className={formCardClass}>
            <h2
              id="search-title"
              className="text-lg font-semibold text-office-icon"
            >
              Search &amp; Sharing
            </h2>
            <p className="mt-1 text-sm text-office-muted">
              Control how your website appears on Google and social media.
            </p>
            <div className="mt-5 flex flex-col gap-5">
              <Field
                id="site-title"
                label="Site title"
                hint={`${values.title.length} / ${TITLE_MAX}`}
              >
                <input
                  id="site-title"
                  maxLength={TITLE_MAX}
                  value={values.title}
                  onChange={(event) => update({ title: event.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field
                id="site-description"
                label="Description"
                hint={`${values.description.length} / ${DESCRIPTION_MAX}`}
              >
                <textarea
                  id="site-description"
                  rows={2}
                  maxLength={DESCRIPTION_MAX}
                  value={values.description}
                  onChange={(event) =>
                    update({ description: event.target.value })
                  }
                  className={cn(
                    inputClass,
                    "h-auto resize-y py-3 leading-relaxed",
                  )}
                />
              </Field>
              <div>
                <p className="mb-2 text-sm font-semibold text-office-icon">
                  Search preview
                </p>
                <div className="rounded-xl border border-office-meter-track bg-office-chip/60 p-4">
                  <div className="flex items-center gap-2.5">
                    {logo ? (
                      <LocalThumbnail
                        file={logo}
                        fit="contain"
                        className="size-7 rounded-full bg-white p-0.5"
                      />
                    ) : (
                      <span className="flex size-7 items-center justify-center rounded-full bg-office-tint-teal text-[0.6rem] font-bold text-office-primary">
                        {name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-xs text-[#202124]">
                        {name}
                      </span>
                      <span className="block truncate text-xs text-[#4d5156]">
                        https://{address}
                      </span>
                    </span>
                  </div>
                  <p className="mt-2 truncate text-lg text-[#1a0dab]">
                    {values.title.trim() || name}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-[#4d5156]">
                    {values.description.trim() ||
                      "Add a description to show it here."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside
          aria-label="Ready to publish"
          className="rounded-2xl border border-office-meter-track bg-card p-5 shadow-[0_4px_16px_rgb(15_107_110/0.06)] xl:sticky xl:top-24 xl:w-80 xl:shrink-0"
        >
          <h2 className="font-semibold text-office-icon">Ready to Publish</h2>
          <dl className="mt-4 flex flex-col gap-3 text-sm">
            <Row label="Template" value={template} />
            <Row label="Web address" value={address} />
            <Row
              label="Pages"
              value={`${pages} ${pages === 1 ? "page" : "pages"}`}
            />
            <Row
              label="Last saved"
              value={lastSaved ? timeAgo(lastSaved) : "Never"}
            />
          </dl>

          {values.publishedAt ? (
            <div
              role="status"
              className="mt-5 rounded-xl bg-office-tint-teal p-4"
            >
              <p className="flex items-center gap-2 font-semibold text-office-primary">
                <CircleCheck aria-hidden="true" className="size-5" />
                Website published
              </p>
              <p className="mt-1 text-sm text-office-icon">{address}</p>
              <p className="mt-2 text-xs text-office-muted">
                Going live needs the publishing service, which is not connected
                yet.
              </p>
            </div>
          ) : (
            <div className="mt-5 border-t border-office-meter-track pt-5">
              <p className="flex gap-2.5 rounded-xl bg-office-tint-teal p-3 text-xs leading-relaxed text-office-primary">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                You can edit and republish your website anytime from the
                dashboard.
              </p>
            </div>
          )}

          {problem ? (
            <p
              role="alert"
              className="mt-4 text-xs font-medium text-office-danger-text"
            >
              {problem}{" "}
              {blocker ? (
                <Link href={reviewHref} className="underline">
                  Go to review
                </Link>
              ) : null}
            </p>
          ) : null}

          <Button
            type="button"
            variant="office"
            onClick={publish}
            className="mt-5 h-11 w-full gap-2.5 text-[0.95rem] font-semibold"
          >
            <CloudUpload aria-hidden="true" className="size-4.5" />
            {values.publishedAt ? "Republish website" : "Publish website"}
          </Button>
          <Button
            asChild
            variant="outline"
            className="mt-3 h-11 w-full border-office-meter-track bg-card text-[0.95rem] font-semibold text-office-icon hover:bg-office-chip"
          >
            <Link href={previewHref}>Back to preview</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}

function Stepper({ stops }: { stops: string[] }) {
  return (
    <nav
      aria-label="Website builder progress"
      className="hidden rounded-2xl border border-office-meter-track bg-card px-3 py-2 lg:block"
    >
      <ol className="flex items-center gap-2">
        {stops.map((stop, index) => {
          const current = index === stops.length - 1;
          return (
            <li key={stop} className="flex items-center gap-2">
              {index ? (
                <span
                  aria-hidden="true"
                  className="h-0.5 w-5 rounded bg-office-icon/70"
                />
              ) : null}
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-semibold",
                  current
                    ? "bg-office-primary text-white"
                    : "bg-office-tint-teal text-office-primary",
                )}
              >
                {current ? (
                  index + 1
                ) : (
                  <Check className="size-4" strokeWidth={2.5} />
                )}
              </span>
              <span
                aria-current={current ? "step" : undefined}
                className={cn(
                  "text-sm whitespace-nowrap text-office-icon",
                  current && "font-semibold",
                )}
              >
                {stop}
                {current ? null : <span className="sr-only"> (done)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function AddressOption({
  title,
  description,
  badge,
  checked,
  disabled,
  children,
}: {
  title: string;
  description: string;
  badge: ReactNode;
  checked?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border-[1.5px] p-4",
        checked
          ? "border-brand-cyan bg-[#f8fcfd]"
          : "border-office-meter-track bg-office-chip/40",
      )}
    >
      <label
        className={cn(
          "flex items-start gap-3",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
        )}
      >
        <input
          type="radio"
          name="address-type"
          checked={Boolean(checked)}
          disabled={disabled}
          readOnly
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-office-primary",
            checked ? "border-office-primary" : "border-office-muted/50",
          )}
        >
          {checked ? (
            <span className="size-2.5 rounded-full bg-office-primary" />
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-office-icon">{title}</span>
          <span className="block text-xs text-office-muted">{description}</span>
        </span>
        {badge}
      </label>
      <div className="pl-8">{children}</div>
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "premium" | "free";
  children: string;
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-md px-2 py-0.5 text-xs font-medium",
        tone === "premium"
          ? "bg-office-tint-orange text-office-ink-orange"
          : "bg-office-chip text-office-icon",
      )}
    >
      {children}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-office-muted">{label}</dt>
      <dd className="text-right font-semibold break-all text-office-icon">
        {value}
      </dd>
    </div>
  );
}
