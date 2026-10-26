import {
  ArrowRight,
  BadgePercent,
  BedDouble,
  CalendarDays,
  CalendarX,
  Check,
  Compass,
  Headphones,
  HeartHandshake,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Tag,
  Users,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import {
  ContactLine,
  Eyebrow,
  initials,
  lines,
  MapSketch,
  Photo,
  SectionHeading,
  sectionClass,
  SiteButton,
  SliderControls,
  titleClass,
} from "./block-parts";
import { EditableText } from "./editable-text";
import { OVERLAY_COLORS } from "./section-style";
import type { SectionType } from "./section-layouts";

type SectionViewProps = {
  type: SectionType;
  props: Record<string, string>;
  images: File[];
};

const heroTitle =
  "font-(family-name:--site-heading) [font-weight:var(--site-heading-weight,400)] text-3xl leading-tight @3xl:text-4xl @5xl:text-5xl";
// Icons for feature lists, used in order.
const FEATURE_ICONS: LucideIcon[] = [
  Waves,
  Compass,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Users,
];
const PERK_ICONS: LucideIcon[] = [
  Tag,
  BadgePercent,
  CalendarX,
  Headphones,
  Sparkles,
  ShieldCheck,
];

// A section in the layout chosen in "Add a section" (or its settings).
export function SectionView({ type, props: p, images }: SectionViewProps) {
  switch (type) {
    case "hero":
      return <Hero p={p} images={images} />;
    case "about":
      return <About p={p} images={images} />;
    case "rooms":
      return <Rooms p={p} images={images} />;
    case "amenities":
      return <Amenities p={p} />;
    case "gallery":
      return <Gallery p={p} images={images} />;
    case "testimonials":
      return <Testimonials p={p} />;
    case "booking":
      return <Booking p={p} images={images} />;
    case "contact":
      return <Contact p={p} />;
  }
}

type Props = { p: Record<string, string>; images?: File[] };

// --hero-text is set by the Style tab's text color (or a dark background).
function HeroText({ light, center }: { light?: boolean; center?: boolean }) {
  const color = light
    ? "text-[var(--hero-text,#ffffff)]"
    : "text-[var(--hero-text,#0b2240)]";
  return (
    <div
      className={cn(
        "section-text relative max-w-xl",
        center && "mx-auto text-center",
      )}
    >
      <Eyebrow className={cn("mb-0", color)} />
      <EditableText
        field="title"
        as="h2"
        defaultLevel="Heading 1"
        placeholder="Heading"
        className={cn("mt-2", heroTitle, color)}
      />
      <EditableText
        field="subtitle"
        placeholder="Subheading"
        className={cn("mt-3 text-sm font-medium @3xl:text-base", color)}
      />
      <SiteButton
        field="button"
        inverse={light && center}
        className="mt-5 gap-2"
      >
        <ArrowRight aria-hidden="true" className="size-4" />
      </SiteButton>
    </div>
  );
}

// Full-bleed photo with the Style tab's overlay; "dim" is the layout's own
// overlay when none is chosen. Nothing when the background is a color or
// gradient.
function HeroBackdrop({
  p,
  images,
  dim,
}: {
  p: Record<string, string>;
  images: File[];
  dim: string;
}) {
  if ((p.bgMode || "Image") !== "Image") return null;
  const overlay = OVERLAY_COLORS[p.overlayColor];
  return (
    <>
      <div className="absolute inset-0 overflow-hidden">
        <Photo
          file={images[0]}
          alt={p.imagesAlt}
          className={cn(
            "h-full w-full",
            p.parallax === "true" &&
              "motion-safe:animate-[site-parallax_linear_both] motion-safe:[animation-timeline:view()]",
          )}
        />
      </div>
      {overlay ? (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: overlay,
            opacity: Number(p.overlayOpacity ?? 30) / 100,
          }}
        />
      ) : (
        <div aria-hidden="true" className={cn("absolute inset-0", dim)} />
      )}
    </>
  );
}

const heroPadding =
  "pt-(--section-pt) pb-(--section-pb) @3xl:pt-(--section-pt-lg) @3xl:pb-(--section-pb-lg)";

function Hero({ p, images = [] }: Props) {
  if (p.layout === "Split") {
    return (
      <section className="grid items-center @3xl:grid-cols-2">
        <div className={cn("px-8 @3xl:px-12", heroPadding)}>
          <HeroText />
        </div>
        <Photo
          file={images[0]}
          className="aspect-[4/3] h-full w-full @3xl:aspect-auto @3xl:min-h-80"
          alt={p.imagesAlt}
        />
      </section>
    );
  }
  if (p.layout === "Centered") {
    return (
      <section
        className={cn(
          "relative flex min-h-72 items-center overflow-hidden px-8 @3xl:min-h-96",
          heroPadding,
        )}
      >
        <HeroBackdrop p={p} images={images} dim="bg-black/45" />
        <div className="relative w-full">
          <HeroText light={(p.bgMode || "Image") === "Image"} center />
        </div>
      </section>
    );
  }
  // "Full image" and "Slider" share left-aligned text over a photo.
  const slider = p.layout === "Slider";
  return (
    <section className="relative flex min-h-72 items-center overflow-hidden @3xl:min-h-96">
      <HeroBackdrop
        p={p}
        images={images}
        dim="bg-linear-to-r from-white/85 via-white/40 to-transparent"
      />
      <div
        className={cn(
          "relative w-full",
          heroPadding,
          slider ? "px-16" : "px-8 @3xl:px-12",
        )}
      >
        <HeroText />
      </div>
      {slider && (p.bgMode || "Image") === "Image" ? (
        <SliderControls count={images.length} />
      ) : null}
    </section>
  );
}

function About({ p, images = [] }: Props) {
  const centered = p.layout === "Centered";
  const text = (
    <div className={cn(centered && "mx-auto max-w-2xl text-center")}>
      <Eyebrow />
      <EditableText
        field="title"
        as="h2"
        defaultLevel="Heading 2"
        placeholder="Heading"
        className={titleClass}
      />
      <EditableText
        field="text"
        placeholder="Description"
        className="mt-3 text-sm leading-relaxed text-(--site-muted) @3xl:text-base"
      />
      <SiteButton field="button" className="mt-5" />
    </div>
  );
  if (centered) return <section className={sectionClass}>{text}</section>;
  return (
    <section
      className={cn(
        sectionClass,
        "grid items-center gap-6 @3xl:grid-cols-2 @3xl:gap-10",
      )}
    >
      <div className={cn(p.layout === "Photo left" && "@3xl:order-2")}>
        {text}
      </div>
      <Photo
        file={images[0]}
        className="aspect-[4/3] w-full rounded-(--site-radius)"
        alt={p.imageAlt}
      />
    </section>
  );
}

function Price({ value }: { value: string }) {
  if (!value) return null;
  return (
    <p className="text-sm font-semibold text-(--site-text)">
      {value} <span className="font-normal text-(--site-muted)">/ night</span>
    </p>
  );
}

function Rooms({ p, images = [] }: Props) {
  const rooms = lines(p.items);
  const heading = <SectionHeading text="subtitle" center />;

  if (p.layout === "List") {
    return (
      <section className={sectionClass}>
        {heading}
        <ul className="mt-6 flex flex-col gap-3">
          {rooms.map((room, index) => (
            <li
              key={`${room.first}-${index}`}
              className="flex items-center gap-4 overflow-hidden rounded-(--site-radius) bg-(--site-surface)"
            >
              <Photo
                file={images[index]}
                icon={BedDouble}
                className="aspect-[4/3] w-32 shrink-0 @3xl:w-44"
              />
              <div className="min-w-0 flex-1">
                <p className="font-(family-name:--site-heading) [font-weight:var(--site-heading-weight,400)] text-lg text-(--site-text)">
                  {room.first}
                </p>
                {room.third ? (
                  <p className="text-xs text-(--site-muted)">{room.third}</p>
                ) : null}
              </div>
              <div className="pr-5 text-right">
                <Price value={room.second} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  }
  if (p.layout === "Featured" && rooms.length) {
    const [first, ...rest] = rooms;
    return (
      <section className={sectionClass}>
        {heading}
        <div className="mt-6 grid gap-4 @3xl:grid-cols-[1.4fr_1fr]">
          <div className="overflow-hidden rounded-(--site-radius) bg-(--site-surface)">
            <Photo
              file={images[0]}
              icon={BedDouble}
              className="aspect-[16/10] w-full"
            />
            <div className="p-5">
              <p className="font-(family-name:--site-heading) [font-weight:var(--site-heading-weight,400)] text-xl text-(--site-text)">
                {first.first}
              </p>
              {first.third ? (
                <p className="mt-1 text-xs text-(--site-muted)">
                  {first.third}
                </p>
              ) : null}
              <div className="mt-2">
                <Price value={first.second} />
              </div>
            </div>
          </div>
          <ul className="flex flex-col gap-4">
            {rest.map((room, index) => (
              <li
                key={`${room.first}-${index}`}
                className="flex items-center gap-3 overflow-hidden rounded-(--site-radius) bg-(--site-surface)"
              >
                <Photo
                  file={images[index + 1]}
                  icon={BedDouble}
                  className="aspect-square w-24 shrink-0"
                />
                <div>
                  <p className="font-(family-name:--site-heading) [font-weight:var(--site-heading-weight,400)] text-base text-(--site-text)">
                    {room.first}
                  </p>
                  <Price value={room.second} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }
  // Cards: a row of room cards with details and a "View Details" button.
  return (
    <section className={sectionClass}>
      {heading}
      <div className="relative mt-6">
        <ul className="grid gap-4 @3xl:grid-cols-3">
          {rooms.map((room, index) => (
            <li
              key={`${room.first}-${index}`}
              className="flex flex-col overflow-hidden rounded-(--site-radius) border border-black/5 bg-white text-[#1f2933] shadow-sm"
            >
              <Photo
                file={images[index]}
                icon={BedDouble}
                className="aspect-[4/3] w-full"
              />
              <div className="flex flex-1 flex-col p-4">
                <p className="font-(family-name:--site-heading) [font-weight:var(--site-heading-weight,400)] text-lg">
                  {room.first}
                </p>
                {room.third ? (
                  <p className="mt-1 text-xs text-[#64748b]">{room.third}</p>
                ) : null}
                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                  {room.second ? (
                    <p className="text-sm font-semibold">
                      {room.second}{" "}
                      <span className="font-normal text-[#64748b]">
                        / night
                      </span>
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="inline-flex h-8 items-center gap-1 rounded-(--site-btn-radius) bg-(--site-primary) px-3 text-xs font-semibold text-(--site-on-primary)">
                    View Details
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {rooms.length > 3 ? <SliderControls count={0} dots={false} /> : null}
      </div>
    </section>
  );
}

function Amenities({ p }: Props) {
  const items = lines(p.items);
  const heading = <SectionHeading center />;
  if (p.layout === "Tags") {
    return (
      <section className={sectionClass}>
        {heading}
        <ul className="mt-6 flex flex-wrap justify-center gap-2">
          {items.map((item, index) => (
            <li
              key={`${item.first}-${index}`}
              className="rounded-full border border-(--site-primary)/35 px-4 py-1.5 text-sm text-(--site-primary)"
            >
              {item.first}
            </li>
          ))}
        </ul>
      </section>
    );
  }
  // Items with a detail ("Beach Access | Steps from the sand") show as
  // centered features; plain items as a checklist.
  const features = items.some((item) => item.second);
  return (
    <section className={sectionClass}>
      {p.title ? heading : null}
      {features ? (
        <ul
          className={cn(
            "grid grid-cols-2 gap-6 @3xl:grid-cols-4",
            p.title && "mt-8",
          )}
        >
          {items.map((item, index) => {
            const Icon = FEATURE_ICONS[index % FEATURE_ICONS.length];
            return (
              <li
                key={`${item.first}-${index}`}
                className="flex flex-col items-center text-center"
              >
                <Icon
                  aria-hidden="true"
                  className="size-7 text-(--site-primary)"
                  strokeWidth={1.5}
                />
                <p className="mt-2 text-sm font-semibold text-(--site-text)">
                  {item.first}
                </p>
                <p className="text-xs text-(--site-muted)">{item.second}</p>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul
          className={cn(
            "grid grid-cols-2 gap-3 @3xl:grid-cols-3",
            p.title && "mt-6",
          )}
        >
          {items.map((item, index) => (
            <li
              key={`${item.first}-${index}`}
              className="flex items-center gap-2.5 text-sm text-(--site-text)"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-(--site-primary)/12 text-(--site-primary)">
                <Check
                  aria-hidden="true"
                  className="size-3.5"
                  strokeWidth={3}
                />
              </span>
              {item.first}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Gallery({ p, images = [] }: Props) {
  const photos = (count: number) =>
    images.length
      ? images
      : (Array.from({ length: count }, () => undefined) as (
          File | undefined
        )[]);
  const heading = <SectionHeading center />;

  if (p.layout === "Slider") {
    return (
      <section className={sectionClass}>
        {heading}
        <div className="relative mt-6 overflow-hidden rounded-(--site-radius)">
          <Photo file={images[0]} className="aspect-[16/9] w-full" />
          <SliderControls count={images.length} />
        </div>
      </section>
    );
  }
  if (p.layout === "Strip") {
    return (
      <section className="pt-(--section-pt) pb-(--section-pb) @3xl:pt-(--section-pt-lg) @3xl:pb-(--section-pb-lg)">
        <div className="px-6 @3xl:px-10">{heading}</div>
        <ul className="mt-6 flex gap-2 overflow-hidden">
          {photos(5).map((file, index) => (
            <li key={index} className="min-w-0 flex-1">
              <Photo file={file} className="aspect-[3/4] w-full" />
            </li>
          ))}
        </ul>
      </section>
    );
  }
  return (
    <section className={sectionClass}>
      {heading}
      <ul className="mt-6 grid grid-cols-2 gap-3 @3xl:grid-cols-4">
        {photos(p.layout === "Mosaic" ? 5 : 4).map((file, index) => (
          <li
            key={index}
            className={cn(
              p.layout === "Mosaic" && index === 0 && "col-span-2 row-span-2",
            )}
          >
            <Photo
              file={file}
              className="aspect-[4/3] h-full w-full rounded-(--site-radius)"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Stars() {
  return (
    <p
      className="text-sm tracking-wider text-(--site-accent)"
      aria-label="5 out of 5 stars"
    >
      ★★★★★
    </p>
  );
}

function Testimonials({ p }: Props) {
  const reviews = lines(p.items);
  if (p.layout === "Single quote") {
    const review = reviews[0];
    return (
      <section className={cn(sectionClass, "text-center")}>
        <Eyebrow />
        {review ? (
          <>
            <blockquote className="mx-auto mt-3 max-w-2xl font-(family-name:--site-heading) [font-weight:var(--site-heading-weight,400)] text-2xl leading-snug text-(--site-text) @3xl:text-3xl">
              “{review.first}”
            </blockquote>
            {review.second ? (
              <p className="mt-4 text-sm font-semibold text-(--site-muted)">
                — {review.second}
                {review.third ? `, ${review.third}` : ""}
              </p>
            ) : null}
          </>
        ) : null}
      </section>
    );
  }
  const list = p.layout === "List";
  return (
    <section className={sectionClass}>
      <SectionHeading center />
      <div className="relative mt-6">
        <ul
          className={cn(
            "gap-4",
            list ? "flex flex-col" : "grid @3xl:grid-cols-3",
          )}
        >
          {reviews.map((review, index) => (
            <li
              key={`${review.first}-${index}`}
              className="flex flex-col gap-3 rounded-(--site-radius) border border-black/5 bg-white p-5 text-[#1f2933] shadow-sm"
            >
              <blockquote className="text-sm leading-relaxed">
                “{review.first}”
              </blockquote>
              <Stars />
              {review.second ? (
                <div className="mt-auto flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(--site-accent) text-xs font-semibold text-white">
                    {initials(review.second)}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">
                      {review.second}
                    </span>
                    {review.third ? (
                      <span className="block text-xs text-[#64748b]">
                        {review.third}
                      </span>
                    ) : null}
                  </span>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
        {!list && reviews.length > 3 ? (
          <SliderControls count={0} dots={false} />
        ) : null}
      </div>
    </section>
  );
}

function Booking({ p, images = [] }: Props) {
  if (p.layout === "Availability bar") {
    return (
      <section className={cn(sectionClass, "bg-(--site-surface)")}>
        <SectionHeading text="text" center />
        <div className="mx-auto mt-6 grid max-w-4xl gap-3 rounded-(--site-radius) bg-white p-4 text-[#1f2933] shadow-sm @3xl:grid-cols-[1fr_1fr_1fr_auto] @3xl:items-end">
          {[
            { label: "Check In", value: "Select date", icon: CalendarDays },
            { label: "Check Out", value: "Select date", icon: CalendarDays },
            { label: "Guests", value: "2 Guests", icon: Users },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="@3xl:border-r @3xl:border-black/5 @3xl:pr-3"
            >
              <p className="text-xs font-semibold">{label}</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-[#64748b]">
                <Icon
                  aria-hidden="true"
                  className="size-4 text-(--site-primary)"
                />
                {value}
              </p>
            </div>
          ))}
          <SiteButton field="button" className="justify-center gap-2">
            <ArrowRight aria-hidden="true" className="size-4" />
          </SiteButton>
        </div>
      </section>
    );
  }
  // Call to action: text, perks and a button beside a photo.
  const perks = lines(p.items);
  return (
    <section
      className={cn(sectionClass, "grid items-center gap-8 @3xl:grid-cols-2")}
    >
      <div>
        <Eyebrow />
        <EditableText
          field="title"
          as="h2"
          defaultLevel="Heading 2"
          placeholder="Heading"
          className={titleClass}
        />
        <EditableText
          field="text"
          placeholder="Text"
          className="mt-3 text-sm text-(--site-muted)"
        />
        {perks.length ? (
          <ul className="mt-6 grid grid-cols-2 gap-4 @3xl:grid-cols-4">
            {perks.map((perk, index) => {
              const Icon = PERK_ICONS[index % PERK_ICONS.length];
              return (
                <li
                  key={`${perk.first}-${index}`}
                  className="flex flex-col items-center gap-2 text-center"
                >
                  <span className="flex size-10 items-center justify-center rounded-full border border-(--site-primary)/25 text-(--site-primary)">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="text-xs text-(--site-text)">
                    {perk.first}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}
        <SiteButton field="button" className="mt-6 gap-2">
          <ArrowRight aria-hidden="true" className="size-4" />
        </SiteButton>
      </div>
      <Photo
        file={images[0]}
        className="aspect-[4/3] w-full rounded-t-[10rem] rounded-b-(--site-radius)"
        alt={p.imageAlt}
      />
    </section>
  );
}

function Contact({ p }: Props) {
  const mapFirst = p.layout === "Map first";
  const simple = p.layout === "Simple";
  const details = (
    <ul
      className={cn(
        "mt-5 gap-3 text-sm text-(--site-text)",
        mapFirst ? "grid @3xl:grid-cols-3" : "flex flex-col",
        simple && "items-center",
      )}
    >
      <ContactLine icon={MapPin}>{p.address || "Add your address"}</ContactLine>
      <ContactLine icon={Phone}>
        {p.phone || "Add your phone number"}
      </ContactLine>
      <ContactLine icon={Mail}>{p.email || "Add your email"}</ContactLine>
    </ul>
  );
  if (simple) {
    return (
      <section className={cn(sectionClass, "text-center")}>
        <SectionHeading center />
        {details}
      </section>
    );
  }
  if (mapFirst) {
    return (
      <section className={sectionClass}>
        <SectionHeading />
        <MapSketch className="mt-6 min-h-56" />
        {details}
      </section>
    );
  }
  return (
    <section className={cn(sectionClass, "grid gap-6 @3xl:grid-cols-2")}>
      <div>
        <SectionHeading />
        {details}
      </div>
      <MapSketch />
    </section>
  );
}
