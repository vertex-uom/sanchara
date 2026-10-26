"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Check, Circle, Pencil } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { COMPANY_PATHS } from "@/lib/routes/backoffice";
import { HEX } from "./brand-colors-form";
import { LocalThumbnail } from "./local-thumbnail";
import { BOOKING_MODES, CANCELLATION } from "./policies-booking-form";
import { describeRoom, formatPrice } from "./room-category";
import type { ContactSocial } from "./contact-social-form";
import type { RoomsPrices } from "./rooms-prices-form";
import { formCardClass } from "./template-fields";
import {
  COLOR_LABELS,
  timeAgo,
  useTemplateStatus,
  type Status,
  type StepCheck,
} from "./template-status";
import { FORM_STEP_COUNT, TEMPLATE_STEPS } from "./template-steps";
import { WEBSITE_PAGES } from "./website-pages";

const REQUIRED_PAGES = WEBSITE_PAGES.filter((page) => page.required).map(
  (page) => page.name,
);
// Final step: every saved answer, grouped by step, with Edit links, and a
// summary card with the checklist. Reads the drafts the steps saved.
export function TemplateReview() {
  const {
    hotel,
    brand,
    rooms,
    facilities,
    policies,
    contact,
    images,
    roomPhotos,
    gallery,
    lastSaved,
    checks,
    done,
    ready,
  } = useTemplateStatus();
  const statusOf = (step: number) => checks[step - 1];

  const roomList = rooms?.rooms ?? [];
  const totalRooms = roomList.reduce(
    (sum, room) => sum + (Number(room.count) || 0),
    0,
  );
  const currency = (rooms?.currency ?? "LKR").split(" - ")[0];
  const menuPages = [...REQUIRED_PAGES, ...(contact?.pages ?? [])];

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        {ready ? (
          <Banner tone="success" title="All required details are complete">
            {done} of {FORM_STEP_COUNT} steps done. Check your answers below,
            then continue to publish.
          </Banner>
        ) : (
          <Banner
            tone="warning"
            title={`${FORM_STEP_COUNT - done} ${FORM_STEP_COUNT - done === 1 ? "step needs" : "steps need"} attention`}
          >
            {done} of {FORM_STEP_COUNT} steps done. Finish the steps marked
            below before publishing.
          </Banner>
        )}

        <ReviewSection check={statusOf(1)} title="Hotel details">
          {images.logo || images.cover || images.about ? (
            <div className="mb-4 flex flex-wrap gap-2.5">
              {images.logo ? (
                <LocalThumbnail
                  file={images.logo}
                  fit="contain"
                  className="h-16 w-16 rounded-lg border border-office-meter-track bg-office-tint-teal p-2"
                />
              ) : null}
              {[images.cover, images.about].map((file, index) =>
                file ? (
                  <LocalThumbnail
                    key={index}
                    file={file}
                    className="h-16 w-24 rounded-lg"
                  />
                ) : null,
              )}
            </div>
          ) : null}
          <Details
            items={[
              ["Hotel name", hotel?.name],
              ["Property type", hotel?.type],
              [
                "Star rating",
                hotel?.stars
                  ? `${hotel.stars} ${hotel.stars === 1 ? "star" : "stars"}`
                  : "Not rated",
              ],
              ["Tagline", hotel?.tagline],
              ["Year established", hotel?.established],
              ["Languages", list(hotel?.languages)],
            ]}
          />
          <Tags items={hotel?.highlights} />
        </ReviewSection>

        <ReviewSection check={statusOf(2)} title="Brand & colors">
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {COLOR_LABELS.map(({ key, label }) => {
              const color = brand?.[key];
              return (
                <li
                  key={key}
                  className="flex items-center gap-2.5 rounded-lg border border-office-meter-track p-2.5"
                >
                  <span
                    aria-hidden="true"
                    className="size-7 shrink-0 rounded-md border border-black/10"
                    style={{
                      backgroundColor:
                        color && HEX.test(color) ? color : "transparent",
                    }}
                  />
                  <span className="min-w-0">
                    <span className="block text-xs text-office-muted">
                      {label}
                    </span>
                    <span className="block text-sm font-semibold text-office-icon uppercase">
                      {color ?? "—"}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </ReviewSection>

        <ReviewSection check={statusOf(3)} title="Rooms & prices">
          <Details
            items={[
              ["Currency", rooms?.currency],
              ["Prices", rooms ? pricesNote(rooms) : undefined],
              [
                "Total rooms",
                roomList.length
                  ? `${totalRooms} ${totalRooms === 1 ? "room" : "rooms"} · ${roomList.length} ${roomList.length === 1 ? "category" : "categories"}`
                  : undefined,
              ],
            ]}
          />
          {roomList.length ? (
            <ul className="mt-4 flex flex-col gap-2.5">
              {roomList.map((room) => (
                <li
                  key={room.id}
                  className="flex items-center gap-3 rounded-lg border border-office-meter-track p-2.5"
                >
                  <LocalThumbnail
                    file={roomPhotos[room.id]?.[0]}
                    className="h-10 w-14 shrink-0 rounded-md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-office-icon">
                      {room.name || "Unnamed room"}
                    </p>
                    <p className="truncate text-xs text-office-muted">
                      {describeRoom(room)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm">
                    <span className="font-semibold text-office-primary">
                      {formatPrice(currency, room.price)}
                    </span>
                    <span className="text-office-muted"> / night</span>
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
          {rooms?.rules?.length ? (
            <div className="mt-4">
              <Details
                items={rooms.rules.map((rule) => [
                  rule.name,
                  [
                    rule.kind === "season"
                      ? `+${Number(rule.amount)}%`
                      : formatPrice(currency, rule.amount),
                    rule.details,
                  ]
                    .filter(Boolean)
                    .join(" · "),
                ])}
              />
            </div>
          ) : null}
        </ReviewSection>

        <ReviewSection check={statusOf(4)} title="Facilities & photos">
          <Tags items={facilities?.amenities} first />
          {gallery.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {gallery.slice(0, 8).map((file, index) => (
                <LocalThumbnail
                  key={`${file.name}-${index}`}
                  file={file}
                  className="h-12 w-16 rounded-md"
                />
              ))}
              {gallery.length > 8 ? (
                <span className="flex h-12 w-16 items-center justify-center rounded-md bg-office-chip text-xs font-semibold text-office-icon">
                  +{gallery.length - 8}
                </span>
              ) : null}
            </div>
          ) : null}
          <div className="mt-4">
            <Details
              items={[
                [
                  "Gallery",
                  `${gallery.length} ${gallery.length === 1 ? "photo" : "photos"}`,
                ],
                [
                  "Guest reviews",
                  facilities
                    ? facilities.showReviews === false
                      ? "Hidden"
                      : `${facilities.reviews?.length ?? 0} ${facilities.reviews?.length === 1 ? "review" : "reviews"} · shown on home page`
                    : undefined,
                ],
                [
                  "Nearby attractions",
                  list(facilities?.attractions?.map((item) => item.name)),
                ],
              ]}
            />
          </div>
        </ReviewSection>

        <ReviewSection check={statusOf(5)} title="Policies & booking">
          <Details
            items={[
              [
                "Check-in / check-out",
                policies?.checkIn && policies.checkOut
                  ? `${formatTime(policies.checkIn)} / ${formatTime(policies.checkOut)}`
                  : undefined,
              ],
              ["Minimum stay", policies?.minStay],
              [
                "Booking type",
                BOOKING_MODES.find(
                  (mode) => mode.value === policies?.bookingMode,
                )?.label,
              ],
              [
                "Deposit",
                policies?.bookingMode === "contact"
                  ? "Not taken online"
                  : policies?.deposit,
              ],
              [
                "Payment methods",
                policies?.bookingMode === "contact"
                  ? "Not taken online"
                  : list(policies?.payments),
              ],
              ["Cancellation", cancellationNote(policies?.cancellation)],
              ["Children", allowed(policies?.children)],
              ["Pets", allowed(policies?.pets)],
              ["Booking alerts", policies?.alertEmail],
            ]}
          />
        </ReviewSection>

        <ReviewSection check={statusOf(6)} title="Contact & social">
          <Details
            items={[
              [
                "Address",
                contact
                  ? list([
                      contact.street,
                      [contact.city, contact.postalCode]
                        .filter(Boolean)
                        .join(" "),
                      contact.country,
                    ])
                  : undefined,
              ],
              [
                "Phone / WhatsApp",
                contact?.phone
                  ? `+94 ${contact.phone}${contact.whatsapp && contact.whatsapp !== contact.phone ? ` / +94 ${contact.whatsapp}` : ""}`
                  : undefined,
              ],
              ["Email", contact?.email],
              ["Social media", contact ? socialNames(contact) : undefined],
              ["Menu pages", contact ? list(menuPages) : undefined],
              ["Front desk", contact?.deskHours],
            ]}
          />
        </ReviewSection>
      </div>

      <aside
        aria-label="Summary"
        className="rounded-2xl border border-office-meter-track bg-card p-5 shadow-[0_4px_16px_rgb(15_107_110/0.06)] xl:sticky xl:top-24 xl:w-80 xl:shrink-0"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-office-icon">Summary</h2>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              ready
                ? "bg-office-tint-teal text-office-primary"
                : "bg-office-tint-orange text-office-ink-orange",
            )}
          >
            {ready ? "Ready to publish" : `${FORM_STEP_COUNT - done} left`}
          </span>
        </div>
        <dl className="mt-4 flex flex-col gap-2 text-xs">
          <SummaryRow label="Template" value="Sanchara Hotel Template" />
          <SummaryRow
            label="Pages"
            value={contact ? `${menuPages.length} pages` : "—"}
          />
          <SummaryRow
            label="Rooms"
            value={
              roomList.length
                ? `${roomList.length} ${roomList.length === 1 ? "category" : "categories"} · ${totalRooms} ${totalRooms === 1 ? "room" : "rooms"}`
                : "—"
            }
          />
          <SummaryRow
            label="Last saved"
            value={lastSaved ? timeAgo(lastSaved) : "Never"}
          />
        </dl>
        <ul className="mt-4 flex flex-col gap-2.5 border-t border-office-meter-track pt-4">
          {checks.map(({ step, status }) => (
            <li
              key={step}
              className="flex items-center gap-2.5 text-sm text-office-icon"
            >
              <StatusIcon status={status} />
              <span className="flex-1">{TEMPLATE_STEPS[step].label}</span>
              <span
                className={cn(
                  "text-xs font-medium",
                  status === "complete" && "text-office-primary",
                  status === "incomplete" && "text-office-ink-orange",
                  status === "not-started" && "text-office-muted",
                )}
              >
                {STATUS_LABELS[status]}
              </span>
            </li>
          ))}
        </ul>
        {ready ? (
          <Button
            asChild
            variant="office"
            className="mt-5 h-11 w-full gap-2.5 text-[0.95rem] font-semibold"
          >
            <Link href={`${COMPANY_PATHS.website}/preview`}>
              Preview website
              <ArrowRight aria-hidden="true" className="size-[18px]" />
            </Link>
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="office"
              disabled
              aria-describedby="preview-note"
              className="mt-5 h-11 w-full gap-2.5 text-[0.95rem] font-semibold"
            >
              Preview website
              <ArrowRight aria-hidden="true" className="size-[18px]" />
            </Button>
            <p id="preview-note" className="mt-2 text-xs text-office-muted">
              Finish every step to preview your website.
            </p>
          </>
        )}
        <Button
          asChild
          variant="outline"
          className="mt-3 h-11 w-full border-office-meter-track bg-card text-[0.95rem] font-semibold text-office-icon hover:bg-office-chip"
        >
          <Link
            href={TEMPLATE_STEPS[FORM_STEP_COUNT].href ?? COMPANY_PATHS.website}
          >
            Back
          </Link>
        </Button>
      </aside>
    </div>
  );
}

const STATUS_LABELS: Record<Status, string> = {
  complete: "Complete",
  incomplete: "Incomplete",
  "not-started": "Not started",
};

function list(items: (string | undefined)[] | undefined) {
  const shown = items?.filter((item) => item?.trim());
  return shown?.length ? shown.join(", ") : undefined;
}

function allowed(value: boolean | undefined) {
  return value === undefined ? undefined : value ? "Allowed" : "Not allowed";
}

function pricesNote({
  taxesIncluded,
  breakfastIncluded,
}: Partial<RoomsPrices>) {
  if (taxesIncluded && breakfastIncluded) return "Taxes & breakfast included";
  if (taxesIncluded) return "Taxes included";
  if (breakfastIncluded) return "Breakfast included · taxes extra";
  return "Taxes extra";
}

// "Flexible · 24 hours" from the policy's description.
function cancellationNote(value: string | undefined) {
  const option = CANCELLATION.find((item) => item.value === value);
  if (!option) return undefined;
  const window = option.description.match(/\d+ (hours|days)/)?.[0];
  return window ? `${option.label} · ${window}` : option.label;
}

function socialNames(contact: Partial<ContactSocial>) {
  const links: [string, string | undefined][] = [
    ["Facebook", contact.facebook],
    ["Instagram", contact.instagram],
    ["TikTok", contact.tiktok],
    ["TripAdvisor", contact.tripadvisor],
    ["YouTube", contact.youtube],
    ["Booking.com / Airbnb", contact.listing],
  ];
  return (
    list(links.filter(([, link]) => link).map(([name]) => name)) ?? "None added"
  );
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function Banner({
  tone,
  title,
  children,
}: {
  tone: "success" | "warning";
  title: string;
  children: ReactNode;
}) {
  const success = tone === "success";
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-4 rounded-2xl border px-5 py-4",
        success
          ? "border-brand-cyan/40 bg-office-tint-teal"
          : "border-office-ink-orange/30 bg-office-tint-orange",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full text-white",
          success ? "bg-office-primary" : "bg-office-ink-orange",
        )}
      >
        {success ? (
          <Check aria-hidden="true" className="size-5" strokeWidth={2.5} />
        ) : (
          <AlertTriangle aria-hidden="true" className="size-5" />
        )}
      </span>
      <div>
        <p
          className={cn(
            "font-semibold",
            success ? "text-office-primary" : "text-office-ink-orange",
          )}
        >
          {title}
        </p>
        <p className="text-xs text-office-muted">{children}</p>
      </div>
    </div>
  );
}

function ReviewSection({
  check,
  title,
  children,
}: {
  check: StepCheck;
  title: string;
  children: ReactNode;
}) {
  const href = TEMPLATE_STEPS[check.step].href;
  const titleId = `review-step-${check.step}`;
  return (
    <section aria-labelledby={titleId} className={formCardClass}>
      <div className="flex items-center gap-3 border-b border-office-meter-track pb-4">
        <StatusIcon status={check.status} large />
        <h2 id={titleId} className="text-lg font-semibold text-office-icon">
          {title}
        </h2>
        <span className="text-xs text-office-muted">Step {check.step}</span>
        {href ? (
          <Button
            asChild
            variant="outline"
            className="ml-auto h-9 gap-1.5 border-office-meter-track bg-card px-3 text-sm font-semibold text-office-icon hover:bg-office-chip"
          >
            <Link href={href}>
              <Pencil aria-hidden="true" className="size-3.5" />
              Edit<span className="sr-only"> {title.toLowerCase()}</span>
            </Link>
          </Button>
        ) : null}
      </div>
      {check.note ? (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-office-tint-orange px-3 py-2 text-xs font-medium text-office-ink-orange">
          <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
          {check.note}
        </p>
      ) : null}
      {check.status === "not-started" ? null : (
        <div className="mt-4">{children}</div>
      )}
    </section>
  );
}

function Details({ items }: { items: [string, string | undefined][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-office-muted">{label}</dt>
          <dd className="mt-0.5 text-sm font-semibold break-words text-office-icon">
            {value?.trim() ? value : "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Tags({
  items,
  first,
}: {
  items: string[] | undefined;
  first?: boolean;
}) {
  if (!items?.length) return null;
  return (
    <ul className={cn("flex flex-wrap gap-2", !first && "mt-4")}>
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full bg-office-tint-teal px-2.5 py-1 text-xs font-medium text-office-primary"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function StatusIcon({ status, large }: { status: Status; large?: boolean }) {
  const size = large ? "size-7" : "size-5";
  if (status === "complete") {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-office-tint-teal text-office-primary",
          size,
        )}
      >
        <Check className={large ? "size-4" : "size-3"} strokeWidth={3} />
      </span>
    );
  }
  if (status === "incomplete") {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-office-tint-orange text-office-ink-orange",
          size,
        )}
      >
        <AlertTriangle className={large ? "size-4" : "size-3"} />
      </span>
    );
  }
  return (
    <Circle
      aria-hidden="true"
      className={cn("shrink-0 text-office-muted/50", size)}
    />
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-office-muted">{label}</dt>
      <dd className="text-right font-semibold text-office-icon">{value}</dd>
    </div>
  );
}
