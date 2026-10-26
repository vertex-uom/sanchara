"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowRight,
  BedDouble,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Image as ImageIcon,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Star,
  X,
} from "lucide-react";
import { cn } from "cn";
import { HEX, type Palette } from "./brand-colors-form";
import type { ContactSocial } from "./contact-social-form";
import type { FacilitiesPhotos } from "./facilities-photos-form";
import type { HotelDetails } from "./hotel-details-form";
import { LocalThumbnail } from "./local-thumbnail";
import { CANCELLATION, type PoliciesBooking } from "./policies-booking-form";
import { describeRoom, formatPrice } from "./room-category";
import type { RoomsPrices } from "./rooms-prices-form";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  YouTubeIcon,
} from "./social-icons";
import type { HotelImages } from "./template-files";
import { WEBSITE_PAGES } from "./website-pages";

export type SiteContent = {
  hotel: Partial<HotelDetails>;
  brand: Partial<Palette>;
  rooms: Partial<RoomsPrices>;
  facilities: Partial<FacilitiesPhotos>;
  policies: Partial<PoliciesBooking>;
  contact: Partial<ContactSocial>;
  images: HotelImages;
  roomPhotos: Record<string, File[]>;
  gallery: File[];
};

type SiteSources = {
  hotel: Partial<HotelDetails> | null;
  brand: Partial<Palette> | null;
  rooms: Partial<RoomsPrices> | null;
  facilities: Partial<FacilitiesPhotos> | null;
  policies: Partial<PoliciesBooking> | null;
  contact: Partial<ContactSocial> | null;
  images: HotelImages;
  roomPhotos: Record<string, File[]>;
  gallery: File[];
};

// Saved answers (any may be missing) plus property defaults → site content.
export function siteContent(
  sources: SiteSources,
  fallback: { hotelName: string; city: string; country: string },
): SiteContent {
  return {
    hotel: {
      ...sources.hotel,
      name: sources.hotel?.name?.trim() || fallback.hotelName,
    },
    brand: sources.brand ?? {},
    rooms: sources.rooms ?? {},
    facilities: sources.facilities ?? {},
    policies: sources.policies ?? {},
    contact: sources.contact ?? {
      city: fallback.city,
      country: fallback.country,
    },
    images: sources.images,
    roomPhotos: sources.roomPhotos,
    gallery: sources.gallery,
  };
}

// Coastal Teal, used for any color the Brand step has not saved.
const DEFAULT_PALETTE: Palette = {
  primary: "#0E5E52",
  secondary: "#0B2545",
  accent: "#F5A524",
  background: "#F7F7F4",
};

// Menu page → section id on the one-page site; null pages have no section yet.
const PAGE_SECTIONS: Record<string, string | null> = {
  Home: "home",
  Rooms: "rooms",
  Booking: "booking",
  Gallery: "gallery",
  Reviews: "reviews",
  Contact: "contact",
  Offers: null,
  Blog: null,
  "Things to do": "things-to-do",
};

// Pages the Contact step starts with, for a draft that was never saved.
const DEFAULT_PAGES = ["Gallery", "Reviews", "Contact"];

// The hotel's website built from the template answers. Breakpoints are
// container queries, so the layout follows the device frame's width, not the
// browser window. Links scroll within the site and never leave the preview.
export function PreviewSite({
  content,
  idPrefix = "site",
}: {
  content: SiteContent;
  // Keeps section ids unique when a page shows the site more than once.
  idPrefix?: string;
}) {
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
  } = content;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const colors = Object.fromEntries(
    Object.entries(DEFAULT_PALETTE).map(([key, fallback]) => {
      const value = brand[key as keyof Palette];
      return [key, value && HEX.test(value) ? value : fallback];
    }),
  ) as Palette;
  const style = {
    "--site-primary": colors.primary,
    "--site-on-primary": readableOn(colors.primary),
    "--site-secondary": colors.secondary,
    "--site-accent": colors.accent,
    "--site-bg": colors.background,
  } as CSSProperties;

  const name = hotel.name?.trim() || "Your Hotel";
  const city = contact.city?.trim();
  const enabledPages = contact.pages ?? DEFAULT_PAGES;
  const menu = WEBSITE_PAGES.filter(
    (page) => page.required || enabledPages.includes(page.name),
  ).map((page) => page.name);
  const shows = (page: string) => menu.includes(page);

  const currency = (rooms.currency ?? "LKR").split(" - ")[0];
  const roomList = rooms.rooms ?? [];
  const reviews =
    facilities.showReviews === false ? [] : (facilities.reviews ?? []);
  const attractions = facilities.attractions ?? [];
  const amenities = facilities.amenities ?? [];
  const slides = [images.cover, ...gallery].filter((file): file is File =>
    Boolean(file),
  );

  function goTo(page: string) {
    setMenuOpen(false);
    const id = PAGE_SECTIONS[page];
    const container = scrollRef.current;
    const section = id
      ? container?.querySelector<HTMLElement>(`#${idPrefix}-${id}`)
      : null;
    if (!container || !section) return;
    container.scrollTo({
      top: Math.max(0, section.offsetTop - 64),
      behavior: "smooth",
    });
  }

  return (
    <div className="relative h-full bg-white text-[#1f2933]" style={style}>
      <div
        ref={scrollRef}
        className="@container relative h-full overflow-x-hidden overflow-y-auto"
      >
        <header className="sticky top-0 z-20 border-b border-black/5 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center gap-4 px-5 @3xl:px-10 @5xl:px-16">
            <button
              type="button"
              onClick={() => goTo("Home")}
              className="flex min-w-0 items-center gap-2.5"
            >
              {images.logo ? (
                <LocalThumbnail
                  file={images.logo}
                  fit="contain"
                  className="size-9 shrink-0"
                />
              ) : (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(--site-primary) text-sm font-semibold text-(--site-on-primary)">
                  {initials(name)}
                </span>
              )}
              <span className="min-w-0 text-left">
                <span className="block truncate font-serif text-xl leading-tight text-(--site-primary) @5xl:text-2xl">
                  {shortName(name, hotel.type)}
                </span>
                {hotel.type ? (
                  <span className="hidden text-[0.6rem] tracking-[0.25em] text-[#475569] uppercase @5xl:block">
                    {hotel.type}
                  </span>
                ) : null}
              </span>
            </button>
            <nav
              aria-label="Site menu"
              className="ml-auto hidden items-center gap-7 @5xl:flex"
            >
              {menu.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => goTo(page)}
                  className="text-sm text-[#1f2933] hover:text-(--site-primary)"
                >
                  {page}
                </button>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-3 @5xl:ml-4">
              <button
                type="button"
                onClick={() => goTo("Booking")}
                className="hidden h-10 items-center rounded-md bg-(--site-primary) px-5 text-sm font-semibold text-(--site-on-primary) @3xl:inline-flex"
              >
                Book Now
              </button>
              <button
                type="button"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className="inline-flex size-9 items-center justify-center text-[#1f2933] @5xl:hidden"
              >
                {menuOpen ? (
                  <X className="size-6" />
                ) : (
                  <Menu className="size-6" />
                )}
              </button>
            </div>
          </div>
          {menuOpen ? (
            <nav
              aria-label="Site menu"
              className="border-t border-black/5 bg-white px-5 py-3 @3xl:px-10 @5xl:hidden"
            >
              <ul className="flex flex-col">
                {menu.map((page) => (
                  <li key={page}>
                    <button
                      type="button"
                      onClick={() => goTo(page)}
                      className="w-full py-2.5 text-left text-base text-[#1f2933]"
                    >
                      {page}
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => goTo("Booking")}
                className="mt-2 h-11 w-full rounded-md bg-(--site-primary) text-sm font-semibold text-(--site-on-primary) @3xl:hidden"
              >
                Book Now
              </button>
            </nav>
          ) : null}
        </header>

        <Hero
          name={name}
          headline={headline(hotel.description, name)}
          tagline={hotel.tagline}
          slides={slides}
          onBook={() => goTo("Booking")}
          id={`${idPrefix}-home`}
        />

        <section
          id={`${idPrefix}-about`}
          className="px-5 py-12 @3xl:px-10 @3xl:py-16 @5xl:px-16"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-8 @3xl:grid-cols-2 @3xl:gap-12">
            <Photo
              file={images.about ?? images.cover ?? undefined}
              className="aspect-[4/3] w-full rounded-xl @3xl:order-2"
            />
            <div>
              <Eyebrow>About us</Eyebrow>
              <Heading>
                {city ? `Your Home in ${city}` : "Your Home Away From Home"}
              </Heading>
              <p className="mt-4 text-sm leading-relaxed text-[#475569] @3xl:text-base">
                {hotel.story?.trim() ||
                  hotel.description?.trim() ||
                  "Tell guests your story in the Hotel details step."}
              </p>
              {hotel.highlights?.length ? (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {hotel.highlights.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-(--site-primary)/25 px-3 py-1 text-xs text-(--site-primary)"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
              <button
                type="button"
                onClick={() => goTo("Rooms")}
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-(--site-primary) px-5 text-sm font-semibold text-(--site-on-primary)"
              >
                Explore rooms
                <ArrowRight aria-hidden="true" className="size-4" />
              </button>
            </div>
          </div>
        </section>

        <section
          id={`${idPrefix}-rooms`}
          className="bg-(--site-bg) px-5 py-12 @3xl:px-10 @3xl:py-16 @5xl:px-16"
        >
          <div className="mx-auto max-w-6xl">
            <Eyebrow>Stay with us</Eyebrow>
            <Heading>Our Rooms</Heading>
            {roomList.length ? (
              <ul className="mt-8 grid gap-5 @3xl:grid-cols-2 @5xl:grid-cols-3">
                {roomList.map((room) => (
                  <li
                    key={room.id}
                    className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm"
                  >
                    <Photo
                      file={roomPhotos[room.id]?.[0]}
                      icon={BedDouble}
                      className="aspect-[4/3] w-full"
                    />
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-serif text-lg text-(--site-secondary)">
                        {room.name || "Room"}
                      </h3>
                      <p className="mt-1 text-xs text-[#64748b]">
                        {describeRoom(room)}
                      </p>
                      {room.features?.length ? (
                        <p className="mt-3 text-xs text-[#475569]">
                          {room.features.slice(0, 4).join(" · ")}
                        </p>
                      ) : null}
                      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                        {rooms.showPrices === false ? (
                          <p className="text-sm text-[#475569]">
                            Contact us for rates
                          </p>
                        ) : (
                          <p>
                            <span className="text-lg font-semibold text-(--site-primary)">
                              {formatPrice(currency, room.price)}
                            </span>
                            <span className="text-xs text-[#64748b]">
                              {rooms.priceBasis?.startsWith("Per person")
                                ? " / person / night"
                                : " / night"}
                            </span>
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => goTo("Booking")}
                          className="h-9 shrink-0 rounded-md border border-(--site-primary) px-4 text-xs font-semibold text-(--site-primary)"
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Add room categories in the Rooms &amp; prices step.</Empty>
            )}
            {rooms.showPrices !== false &&
            (rooms.taxesIncluded || rooms.breakfastIncluded) ? (
              <p className="mt-5 text-xs text-[#64748b]">
                {[
                  rooms.taxesIncluded && "Taxes & service charge included",
                  rooms.breakfastIncluded && "Breakfast included",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}
          </div>
        </section>

        {amenities.length ? (
          <section
            id={`${idPrefix}-amenities`}
            className="px-5 py-12 @3xl:px-10 @3xl:py-16 @5xl:px-16"
          >
            <div className="mx-auto max-w-6xl">
              <Eyebrow>Facilities</Eyebrow>
              <Heading>Amenities</Heading>
              <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 @3xl:grid-cols-3 @5xl:grid-cols-4">
                {amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="flex items-center gap-2.5 text-sm text-[#1f2933]"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-(--site-primary)/10 text-(--site-primary)">
                      <Check
                        aria-hidden="true"
                        className="size-3.5"
                        strokeWidth={3}
                      />
                    </span>
                    {amenity}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {shows("Gallery") && gallery.length ? (
          <section
            id={`${idPrefix}-gallery`}
            className="bg-(--site-bg) px-5 py-12 @3xl:px-10 @3xl:py-16 @5xl:px-16"
          >
            <div className="mx-auto max-w-6xl">
              <Eyebrow>Gallery</Eyebrow>
              <Heading>A Look Around</Heading>
              <ul className="mt-8 grid grid-cols-2 gap-3 @3xl:grid-cols-3 @5xl:grid-cols-4">
                {gallery.map((file, index) => (
                  <li key={`${file.name}-${index}`}>
                    <LocalThumbnail
                      file={file}
                      className="aspect-[4/3] w-full rounded-lg"
                    />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {shows("Reviews") && reviews.length ? (
          <section
            id={`${idPrefix}-reviews`}
            className="px-5 py-12 @3xl:px-10 @3xl:py-16 @5xl:px-16"
          >
            <div className="mx-auto max-w-6xl">
              <Eyebrow>Reviews</Eyebrow>
              <Heading>What Our Guests Say</Heading>
              <ul className="mt-8 grid gap-5 @3xl:grid-cols-2 @5xl:grid-cols-3">
                {reviews.map((review) => (
                  <li
                    key={review.id}
                    className="rounded-xl border border-black/5 bg-white p-5 shadow-sm"
                  >
                    <p
                      className="flex gap-0.5"
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          aria-hidden="true"
                          className={cn(
                            "size-4",
                            star <= review.rating
                              ? "fill-(--site-accent) text-(--site-accent)"
                              : "text-[#cbd5e1]",
                          )}
                        />
                      ))}
                    </p>
                    <blockquote className="mt-3 text-sm leading-relaxed text-[#334155]">
                      “{review.text}”
                    </blockquote>
                    <p className="mt-4 text-sm font-semibold text-(--site-secondary)">
                      {review.name}
                      {review.country ? (
                        <span className="font-normal text-[#64748b]">
                          {" "}
                          · {review.country}
                        </span>
                      ) : null}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {attractions.length ? (
          <section
            id={`${idPrefix}-things-to-do`}
            className="bg-(--site-bg) px-5 py-12 @3xl:px-10 @3xl:py-16 @5xl:px-16"
          >
            <div className="mx-auto max-w-6xl">
              <Eyebrow>Explore</Eyebrow>
              <Heading>Things to Do Nearby</Heading>
              <ul className="mt-8 grid gap-3 @3xl:grid-cols-2">
                {attractions.map((place) => (
                  <li
                    key={place.id}
                    className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm"
                  >
                    <MapPin
                      aria-hidden="true"
                      className="size-5 shrink-0 text-(--site-primary)"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-(--site-secondary)">
                        {place.name}
                      </span>
                      {place.description ? (
                        <span className="block text-xs text-[#64748b]">
                          {place.description}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-[#334155]">
                      {Number(place.distance)} km
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        <section
          id={`${idPrefix}-booking`}
          className="px-5 py-12 @3xl:px-10 @3xl:py-16 @5xl:px-16"
        >
          <div className="mx-auto max-w-6xl">
            <Eyebrow>Plan your stay</Eyebrow>
            <Heading>Booking &amp; Policies</Heading>
            <dl className="mt-8 grid gap-4 @md:grid-cols-2 @5xl:grid-cols-4">
              <Fact
                label="Check-in"
                value={
                  policies.checkIn
                    ? `From ${formatTime(policies.checkIn)}`
                    : "—"
                }
              />
              <Fact
                label="Check-out"
                value={
                  policies.checkOut
                    ? `Until ${formatTime(policies.checkOut)}`
                    : "—"
                }
              />
              <Fact label="Minimum stay" value={policies.minStay ?? "—"} />
              <Fact
                label="Cancellation"
                value={
                  CANCELLATION.find(
                    (item) => item.value === policies.cancellation,
                  )?.description ?? "—"
                }
              />
            </dl>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#334155]">
              <Rule allowed={policies.children !== false}>Children</Rule>
              <Rule allowed={policies.pets === true}>Pets</Rule>
              <Rule allowed={policies.smoking === true}>Smoking</Rule>
            </ul>
            {policies.houseRules?.trim() ? (
              <p className="mt-4 text-sm leading-relaxed text-[#475569]">
                {policies.houseRules}
              </p>
            ) : null}
            <button
              type="button"
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-md bg-(--site-primary) px-6 text-sm font-semibold text-(--site-on-primary)"
            >
              {policies.bookingMode === "contact"
                ? "Contact us to book"
                : policies.bookingMode === "request"
                  ? "Request a booking"
                  : "Check availability"}
              <ArrowRight aria-hidden="true" className="size-4" />
            </button>
          </div>
        </section>

        {shows("Contact") ? (
          <section
            id={`${idPrefix}-contact`}
            className="bg-(--site-bg) px-5 py-12 @3xl:px-10 @3xl:py-16 @5xl:px-16"
          >
            <div className="mx-auto grid max-w-6xl gap-8 @3xl:grid-cols-2">
              <div>
                <Eyebrow>Contact</Eyebrow>
                <Heading>Find Us</Heading>
                <ul className="mt-6 flex flex-col gap-3 text-sm text-[#334155]">
                  <ContactLine icon={MapPin}>
                    {[
                      contact.street,
                      [contact.city, contact.postalCode]
                        .filter(Boolean)
                        .join(" "),
                      contact.country,
                    ]
                      .filter((part) => part?.trim())
                      .join(", ") || "Add your address in the Contact step."}
                  </ContactLine>
                  {contact.phone ? (
                    <ContactLine icon={Phone}>+94 {contact.phone}</ContactLine>
                  ) : null}
                  {contact.email ? (
                    <ContactLine icon={Mail}>{contact.email}</ContactLine>
                  ) : null}
                  {contact.deskHours ? (
                    <ContactLine icon={Clock}>
                      Front desk: {contact.deskHours}
                    </ContactLine>
                  ) : null}
                </ul>
                {contact.directions?.trim() ? (
                  <p className="mt-5 text-sm leading-relaxed text-[#475569]">
                    {contact.directions}
                  </p>
                ) : null}
              </div>
              <MapSketch name={name} pin={contact.pin} />
            </div>
          </section>
        ) : null}

        <footer className="bg-(--site-secondary) px-5 py-10 text-white/80 @3xl:px-10 @5xl:px-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 @3xl:flex-row @3xl:items-end @3xl:justify-between">
            <div>
              <p className="font-serif text-xl text-white">{name}</p>
              {hotel.tagline ? (
                <p className="mt-1 text-sm">{hotel.tagline}</p>
              ) : null}
              <p className="mt-4 text-xs text-white/60">
                © {new Date().getFullYear()} {name}. Built with Sanchara.
              </p>
            </div>
            <SocialLinks contact={contact} />
          </div>
        </footer>
      </div>

      {contact.whatsappButton !== false &&
      (contact.whatsapp || contact.phone) ? (
        <span
          aria-label="WhatsApp chat button"
          role="img"
          className="absolute right-4 bottom-4 z-30 flex size-12 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg"
        >
          <MessageCircle aria-hidden="true" className="size-6" />
        </span>
      ) : null}
    </div>
  );
}

function Hero({
  name,
  headline,
  tagline,
  slides,
  onBook,
  id,
}: {
  id: string;
  name: string;
  headline: string;
  tagline: string | undefined;
  slides: File[];
  onBook: () => void;
}) {
  const [index, setIndex] = useState(0);
  const current = slides.length ? index % slides.length : 0;
  const step = (by: number) =>
    setIndex((current + by + slides.length) % slides.length);

  return (
    <section
      id={id}
      aria-roledescription="carousel"
      className="relative flex h-64 items-center overflow-hidden @md:h-72 @3xl:h-96 @5xl:h-[30rem]"
    >
      <Photo
        file={slides[current]}
        className="absolute inset-0 h-full w-full"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-r from-white/80 via-white/40 to-transparent"
      />
      <div className="relative px-12 @3xl:px-16 @5xl:px-24">
        <p className="text-[0.6rem] font-semibold tracking-[0.25em] text-(--site-secondary) uppercase @3xl:text-xs">
          Welcome to {name}
        </p>
        <h1 className="mt-3 max-w-[16ch] font-serif text-2xl leading-tight text-(--site-secondary) @3xl:text-4xl @5xl:text-5xl">
          {headline}
        </h1>
        {tagline ? (
          <p className="mt-3 text-sm font-medium text-(--site-secondary) @3xl:text-lg">
            {tagline}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onBook}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-(--site-primary) px-4 text-xs font-semibold text-(--site-on-primary) shadow @3xl:h-12 @3xl:px-6 @3xl:text-sm"
        >
          Book Your Stay
          <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      </div>
      {slides.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => step(-1)}
            className="absolute left-3 flex size-8 items-center justify-center rounded-full bg-white/90 text-[#1f2933] shadow @3xl:size-10"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => step(1)}
            className="absolute right-3 flex size-8 items-center justify-center rounded-full bg-white/90 text-[#1f2933] shadow @3xl:size-10"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
            {slides.map((file, dot) => (
              <button
                key={`${file.name}-${dot}`}
                type="button"
                aria-label={`Show photo ${dot + 1} of ${slides.length}`}
                aria-current={dot === current}
                onClick={() => setIndex(dot)}
                className={cn(
                  "size-2 rounded-full",
                  dot === current ? "bg-white" : "bg-white/50",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

// A picked photo, or a brand-colored stand-in until one is added.
function Photo({
  file,
  className,
  icon: Icon = ImageIcon,
}: {
  file: File | undefined;
  className: string;
  icon?: typeof ImageIcon;
}) {
  if (file) return <LocalThumbnail file={file} className={className} />;
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center bg-linear-to-br from-(--site-primary)/70 to-(--site-secondary)/80",
        className,
      )}
    >
      <Icon className="size-10 text-white/50" strokeWidth={1.25} />
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.65rem] font-semibold tracking-[0.25em] text-(--site-primary) uppercase">
      {children}
    </p>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-2 font-serif text-2xl leading-tight text-(--site-secondary) @3xl:text-3xl">
      {children}
    </h2>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="mt-8 rounded-xl border border-dashed border-black/15 bg-white/60 p-6 text-center text-sm text-[#64748b]">
      {children}
    </p>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/5 bg-(--site-bg) p-4">
      <dt className="text-xs text-[#64748b]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-(--site-secondary)">
        {value}
      </dd>
    </div>
  );
}

function Rule({ allowed, children }: { allowed: boolean; children: string }) {
  return (
    <li className="flex items-center gap-1.5">
      {allowed ? (
        <Check
          aria-hidden="true"
          className="size-4 text-(--site-primary)"
          strokeWidth={2.5}
        />
      ) : (
        <X
          aria-hidden="true"
          className="size-4 text-[#94a3b8]"
          strokeWidth={2.5}
        />
      )}
      {children} {allowed ? "allowed" : "not allowed"}
    </li>
  );
}

function ContactLine({
  icon: Icon,
  children,
}: {
  icon: typeof MapPin;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-(--site-primary)"
      />
      <span>{children}</span>
    </li>
  );
}

// The Contact step's map drawing, with the pin where the owner placed it.
function MapSketch({
  name,
  pin,
}: {
  name: string;
  pin: ContactSocial["pin"] | undefined;
}) {
  const at = pin ?? { x: 50, y: 42 };
  return (
    <div
      aria-hidden="true"
      className="relative min-h-56 overflow-hidden rounded-xl bg-[#e8f1ec]"
    >
      <div className="absolute inset-x-0 bottom-0 h-[26%] bg-[#cfe6ee]" />
      <div className="absolute inset-x-0 top-[55%] h-2 bg-white" />
      <div className="absolute inset-y-0 left-[32%] w-2 bg-white" />
      <div className="absolute inset-y-0 left-[66%] w-2 bg-white" />
      <MapPin
        className="absolute size-8 -translate-x-1/2 -translate-y-full fill-(--site-primary) stroke-white"
        strokeWidth={1.5}
        style={{ left: `${at.x}%`, top: `${at.y}%` }}
      />
      <span
        className="absolute ml-4 -translate-y-[160%] rounded-md bg-white px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-[#1f2933] shadow"
        style={{ left: `${at.x}%`, top: `${at.y}%` }}
      >
        {name}
      </span>
    </div>
  );
}

function SocialLinks({ contact }: { contact: Partial<ContactSocial> }) {
  const links = [
    { name: "Facebook", value: contact.facebook, icon: FacebookIcon },
    { name: "Instagram", value: contact.instagram, icon: InstagramIcon },
    { name: "TikTok", value: contact.tiktok, icon: TikTokIcon },
    { name: "YouTube", value: contact.youtube, icon: YouTubeIcon },
  ].filter((link) => link.value);
  if (!links.length) return null;
  return (
    <ul className="flex gap-3">
      {links.map(({ name, icon: Icon }) => (
        <li key={name}>
          <span
            role="img"
            aria-label={name}
            className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white"
          >
            <Icon className="size-4" />
          </span>
        </li>
      ))}
    </ul>
  );
}

// First sentence of the short description when it reads as a headline.
function headline(description: string | undefined, name: string) {
  const first = description
    ?.trim()
    .split(/(?<=[.!?])\s/)[0]
    ?.replace(/[.!?]$/, "");
  return first && first.length >= 10 && first.length <= 70 ? first : name;
}

// "Palm Breeze Guest House" shows as "Palm Breeze" next to the "Guest House" label.
export function shortName(name: string, type: string | undefined) {
  if (type && name.toLowerCase().endsWith(` ${type.toLowerCase()}`)) {
    return name.slice(0, -type.length - 1);
  }
  return name;
}

// Free web address: "Palm Breeze Guest House" (Guest House) → "palmbreeze.sanchara.site".
export function siteAddress(name: string, type?: string) {
  const slug = shortName(name, type)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return `${slug || "yourhotel"}.sanchara.site`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// White or dark text, whichever reads better on the brand color.
export function readableOn(hex: string) {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.4 ? "#0b2240" : "#ffffff";
}
