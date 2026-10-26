import {
  BedDouble,
  CalendarDays,
  Check,
  Mail,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import { cn } from "cn";
import {
  ContactLine,
  Eyebrow,
  lines,
  MapSketch,
  Photo,
  sectionClass,
  SiteButton,
  SliderControls,
  titleClass,
} from "./block-parts";
import type { SectionType } from "./section-layouts";

type SectionViewProps = {
  type: SectionType;
  props: Record<string, string>;
  images: File[];
};

const heroTitle =
  "font-(family-name:--site-heading) text-3xl leading-tight @3xl:text-4xl @5xl:text-5xl";

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
      return <Booking p={p} />;
    case "contact":
      return <Contact p={p} />;
  }
}

type Props = { p: Record<string, string>; images?: File[] };

function HeroText({
  p,
  light,
  center,
}: {
  p: Record<string, string>;
  light?: boolean;
  center?: boolean;
}) {
  const color = light ? "text-white" : "text-[#0b2240]";
  return (
    <div className={cn("relative max-w-xl", center && "mx-auto text-center")}>
      {p.eyebrow ? (
        <p
          className={cn(
            "text-[0.65rem] font-semibold tracking-[0.25em] uppercase",
            color,
          )}
        >
          {p.eyebrow}
        </p>
      ) : null}
      <h2 className={cn("mt-2", heroTitle, color)}>{p.title}</h2>
      {p.subtitle ? (
        <p className={cn("mt-3 text-sm font-medium @3xl:text-base", color)}>
          {p.subtitle}
        </p>
      ) : null}
      {p.button ? (
        <SiteButton inverse={light && center} className="mt-5">
          {p.button}
        </SiteButton>
      ) : null}
    </div>
  );
}

function Hero({ p, images = [] }: Props) {
  if (p.layout === "Split") {
    return (
      <section className="grid items-center bg-(--site-page) @3xl:grid-cols-2">
        <div className="px-8 py-10 @3xl:px-12">
          <HeroText p={p} />
        </div>
        <Photo
          file={images[0]}
          className="aspect-[4/3] h-full w-full @3xl:aspect-auto @3xl:min-h-80"
        />
      </section>
    );
  }
  if (p.layout === "Centered") {
    return (
      <section className="relative flex min-h-72 items-center overflow-hidden px-8 py-12 @3xl:min-h-96">
        <Photo file={images[0]} className="absolute inset-0 h-full w-full" />
        <div aria-hidden="true" className="absolute inset-0 bg-black/45" />
        <div className="relative w-full">
          <HeroText p={p} light center />
        </div>
      </section>
    );
  }
  // "Full image" and "Slider" share the left-aligned text over a photo.
  const slider = p.layout === "Slider";
  return (
    <section className="relative flex min-h-72 items-center overflow-hidden @3xl:min-h-96">
      <Photo file={images[0]} className="absolute inset-0 h-full w-full" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-r from-white/85 via-white/40 to-transparent"
      />
      <div
        className={cn("relative py-10", slider ? "px-16" : "px-8 @3xl:px-12")}
      >
        <HeroText p={p} />
      </div>
      {slider ? <SliderControls count={images.length} /> : null}
    </section>
  );
}

function About({ p, images = [] }: Props) {
  const text = (
    <div
      className={cn(p.layout === "Centered" && "mx-auto max-w-2xl text-center")}
    >
      <Eyebrow>{p.eyebrow}</Eyebrow>
      <h2 className={titleClass}>{p.title}</h2>
      <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-(--site-muted) @3xl:text-base">
        {p.text}
      </p>
    </div>
  );
  if (p.layout === "Centered")
    return <section className={sectionClass}>{text}</section>;
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
      <Photo file={images[0]} className="aspect-[4/3] w-full rounded-xl" />
    </section>
  );
}

function Rooms({ p, images = [] }: Props) {
  const rooms = lines(p.items);
  const price = (value: string) =>
    value ? (
      <p className="mt-1 text-sm font-semibold text-(--site-primary)">
        {value} <span className="font-normal text-(--site-muted)">/ night</span>
      </p>
    ) : null;

  if (p.layout === "List") {
    return (
      <section className={sectionClass}>
        <h2 className={titleClass}>{p.title}</h2>
        <ul className="mt-6 flex flex-col gap-3">
          {rooms.map((room, index) => (
            <li
              key={`${room.first}-${index}`}
              className="flex items-center gap-4 overflow-hidden rounded-xl bg-(--site-surface)"
            >
              <Photo
                file={images[index]}
                icon={BedDouble}
                className="aspect-[4/3] w-32 shrink-0 @3xl:w-44"
              />
              <p className="flex-1 font-(family-name:--site-heading) text-lg text-(--site-text)">
                {room.first}
              </p>
              <div className="pr-5 text-right">{price(room.second)}</div>
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
        <h2 className={titleClass}>{p.title}</h2>
        <div className="mt-6 grid gap-4 @3xl:grid-cols-[1.4fr_1fr]">
          <div className="overflow-hidden rounded-xl bg-(--site-surface)">
            <Photo
              file={images[0]}
              icon={BedDouble}
              className="aspect-[16/10] w-full"
            />
            <div className="p-5">
              <p className="font-(family-name:--site-heading) text-xl text-(--site-text)">
                {first.first}
              </p>
              {price(first.second)}
            </div>
          </div>
          <ul className="flex flex-col gap-4">
            {rest.map((room, index) => (
              <li
                key={`${room.first}-${index}`}
                className="flex items-center gap-3 overflow-hidden rounded-xl bg-(--site-surface)"
              >
                <Photo
                  file={images[index + 1]}
                  icon={BedDouble}
                  className="aspect-square w-24 shrink-0"
                />
                <div>
                  <p className="font-(family-name:--site-heading) text-base text-(--site-text)">
                    {room.first}
                  </p>
                  {price(room.second)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }
  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>{p.title}</h2>
      <ul className="mt-6 grid gap-4 @3xl:grid-cols-3">
        {rooms.map((room, index) => (
          <li
            key={`${room.first}-${index}`}
            className="overflow-hidden rounded-xl bg-(--site-surface)"
          >
            <Photo
              file={images[index]}
              icon={BedDouble}
              className="aspect-[4/3] w-full"
            />
            <div className="p-4">
              <p className="font-(family-name:--site-heading) text-lg text-(--site-text)">
                {room.first}
              </p>
              {price(room.second)}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Amenities({ p }: Props) {
  const items = lines(p.items);
  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>{p.title}</h2>
      {p.layout === "Tags" ? (
        <ul className="mt-6 flex flex-wrap gap-2">
          {items.map((item, index) => (
            <li
              key={`${item.first}-${index}`}
              className="rounded-full border border-(--site-primary)/35 px-4 py-1.5 text-sm text-(--site-primary)"
            >
              {item.first}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 @3xl:grid-cols-3">
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

  if (p.layout === "Slider") {
    return (
      <section className={sectionClass}>
        <h2 className={titleClass}>{p.title}</h2>
        <div className="relative mt-6 overflow-hidden rounded-xl">
          <Photo file={images[0]} className="aspect-[16/9] w-full" />
          <SliderControls count={images.length} />
        </div>
      </section>
    );
  }
  if (p.layout === "Strip") {
    return (
      <section className="py-10 @3xl:py-14">
        <h2 className={cn(titleClass, "px-6 @3xl:px-10")}>{p.title}</h2>
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
  if (p.layout === "Mosaic") {
    return (
      <section className={sectionClass}>
        <h2 className={titleClass}>{p.title}</h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 @3xl:grid-cols-4">
          {photos(5).map((file, index) => (
            <li
              key={index}
              className={cn(index === 0 && "col-span-2 row-span-2")}
            >
              <Photo
                file={file}
                className="aspect-[4/3] h-full w-full rounded-lg"
              />
            </li>
          ))}
        </ul>
      </section>
    );
  }
  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>{p.title}</h2>
      <ul className="mt-6 grid grid-cols-2 gap-3 @3xl:grid-cols-4">
        {photos(4).map((file, index) => (
          <li key={index}>
            <Photo file={file} className="aspect-[4/3] w-full rounded-lg" />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Testimonials({ p }: Props) {
  const reviews = lines(p.items);
  if (p.layout === "Single quote") {
    const review = reviews[0];
    return (
      <section className={cn(sectionClass, "text-center")}>
        <Eyebrow>{p.title}</Eyebrow>
        {review ? (
          <>
            <blockquote className="mx-auto mt-3 max-w-2xl font-(family-name:--site-heading) text-2xl leading-snug text-(--site-text) @3xl:text-3xl">
              “{review.first}”
            </blockquote>
            {review.second ? (
              <p className="mt-4 text-sm font-semibold text-(--site-muted)">
                — {review.second}
              </p>
            ) : null}
          </>
        ) : null}
      </section>
    );
  }
  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>{p.title}</h2>
      <ul
        className={cn(
          "mt-6 gap-4",
          p.layout === "List" ? "flex flex-col" : "grid @3xl:grid-cols-2",
        )}
      >
        {reviews.map((review, index) => (
          <li
            key={`${review.first}-${index}`}
            className="flex gap-4 rounded-xl bg-(--site-surface) p-5"
          >
            {p.layout === "List" ? (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--site-primary)/12 text-(--site-primary)">
                <Users aria-hidden="true" className="size-4" />
              </span>
            ) : null}
            <div>
              <p className="text-(--site-accent)" aria-hidden="true">
                ★★★★★
              </p>
              <blockquote className="mt-2 text-sm leading-relaxed text-(--site-text)">
                “{review.first}”
              </blockquote>
              {review.second ? (
                <p className="mt-3 text-sm font-semibold text-(--site-text)">
                  {review.second}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Booking({ p }: Props) {
  if (p.layout === "Booking card") {
    return (
      <section
        className={cn(sectionClass, "grid items-center gap-6 @3xl:grid-cols-2")}
      >
        <div>
          <h2 className={titleClass}>{p.title}</h2>
          {p.text ? (
            <p className="mt-3 text-sm text-(--site-muted)">{p.text}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 rounded-xl bg-white p-5 text-[#1f2933] shadow-lg">
          <div className="grid grid-cols-2 gap-3">
            {["Check-in", "Check-out"].map((label) => (
              <span
                key={label}
                className="flex h-11 items-center gap-2 rounded-md border border-black/10 px-3 text-sm text-[#64748b]"
              >
                <CalendarDays
                  aria-hidden="true"
                  className="size-4 text-(--site-primary)"
                />
                {label}
              </span>
            ))}
          </div>
          <span className="flex h-11 items-center gap-2 rounded-md border border-black/10 px-3 text-sm text-[#64748b]">
            <Users
              aria-hidden="true"
              className="size-4 text-(--site-primary)"
            />
            2 guests
          </span>
          <SiteButton className="justify-center">
            {p.button || "Check availability"}
          </SiteButton>
        </div>
      </section>
    );
  }
  return (
    <section className="bg-(--site-primary) px-6 py-10 text-center text-(--site-on-primary) @3xl:px-10">
      <h2 className="font-(family-name:--site-heading) text-2xl @3xl:text-3xl">
        {p.title}
      </h2>
      {p.text ? <p className="mt-2 text-sm opacity-85">{p.text}</p> : null}
      {p.button ? (
        <SiteButton inverse className="mt-5">
          {p.button}
        </SiteButton>
      ) : null}
    </section>
  );
}

function Contact({ p }: Props) {
  const details = (
    <ul
      className={cn(
        "mt-5 gap-3 text-sm text-(--site-text)",
        p.layout === "Map first" ? "grid @3xl:grid-cols-3" : "flex flex-col",
        p.layout === "Simple" && "items-center",
      )}
    >
      <ContactLine icon={MapPin}>{p.address || "Add your address"}</ContactLine>
      <ContactLine icon={Phone}>
        {p.phone || "Add your phone number"}
      </ContactLine>
      <ContactLine icon={Mail}>{p.email || "Add your email"}</ContactLine>
    </ul>
  );
  if (p.layout === "Simple") {
    return (
      <section className={cn(sectionClass, "text-center")}>
        <h2 className={titleClass}>{p.title}</h2>
        {details}
      </section>
    );
  }
  if (p.layout === "Map first") {
    return (
      <section className={sectionClass}>
        <h2 className={titleClass}>{p.title}</h2>
        <MapSketch className="mt-6 min-h-56" />
        {details}
      </section>
    );
  }
  return (
    <section className={cn(sectionClass, "grid gap-6 @3xl:grid-cols-2")}>
      <div>
        <h2 className={titleClass}>{p.title}</h2>
        {details}
      </div>
      <MapSketch />
    </section>
  );
}
