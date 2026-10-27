"use client";

import {
  BarChart3,
  BedDouble,
  Box,
  CalendarDays,
  Globe,
  Image as ImageIcon,
  Link2,
  List,
  Mountain,
  MessageSquare,
  Minus,
  Play,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Photo, SiteButton } from "./block-parts";
import { SECTION_LAYOUTS, type SectionType } from "./section-layouts";
import { BlockContext, EditableText } from "./editable-text";
import { SectionView } from "./section-views";

export type BlockType =
  | "hero"
  | "about"
  | "rooms"
  | "amenities"
  | "gallery"
  | "testimonials"
  | "booking"
  | "contact"
  | "heading"
  | "text"
  | "image"
  | "button"
  | "video"
  | "divider";

export type BuilderBlock = {
  id: string;
  type: BlockType;
  props: Record<string, string>;
};

export type FieldDef = {
  key: string;
  label: string;
  // "link" picks a page of the site (or the booking section).
  kind: "text" | "textarea" | "select" | "image" | "images" | "link";
  options?: string[];
  hint?: string;
  // Textarea height (default 4).
  rows?: number;
};

// What a new block starts with: the site's name and tagline from Site basics.
export type BlockContext = { name: string; tagline: string };

type BlockDef = {
  label: string;
  icon: LucideIcon;
  group: "section" | "element";
  fields: FieldDef[];
  defaults: (context: BlockContext) => Record<string, string>;
};

const LINES_HINT = "One per line";

// Default target for booking buttons.
export const BOOKING_LINK = "Booking section";

export function isSection(type: BlockType): type is SectionType {
  return type in SECTION_LAYOUTS;
}

export const BLOCKS: Record<BlockType, BlockDef> = {
  hero: {
    label: "Hero",
    icon: ImageIcon,
    group: "section",
    fields: [
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "title", label: "Heading", kind: "textarea", rows: 2 },
      { key: "subtitle", label: "Subheading", kind: "text" },
      {
        key: "images",
        label: "Background image",
        kind: "images",
        hint: "The first photo shows first; Slider uses them all",
      },
      { key: "button", label: "Button text", kind: "text" },
      { key: "buttonLink", label: "Button link", kind: "link" },
    ],
    defaults: ({ name, tagline }) => ({
      layout: SECTION_LAYOUTS.hero[0].label,
      eyebrow: `Welcome to ${name}`,
      title: "A Peaceful Stay by the Southern Coast",
      subtitle: tagline || "Relax. Explore. Feel at Home.",
      button: "Book Your Stay",
      buttonLink: BOOKING_LINK,
    }),
  },
  about: {
    label: "About",
    icon: FileText,
    group: "section",
    fields: [
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "title", label: "Heading", kind: "textarea", rows: 2 },
      { key: "text", label: "Description", kind: "textarea" },
      { key: "image", label: "Photo", kind: "image" },
      { key: "button", label: "Button text", kind: "text" },
      { key: "buttonLink", label: "Button link", kind: "link" },
    ],
    defaults: ({ name }) => ({
      layout: SECTION_LAYOUTS.about[0].label,
      eyebrow: "About us",
      title: "Your Coastal Home",
      text: `${name} offers a unique blend of modern comfort and tropical charm, steps from the beach.`,
      button: "Learn More",
      buttonLink: "Home page",
    }),
  },
  rooms: {
    label: "Rooms",
    icon: BedDouble,
    group: "section",
    fields: [
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "title", label: "Heading", kind: "text" },
      { key: "subtitle", label: "Intro", kind: "text" },
      {
        key: "items",
        label: "Rooms",
        kind: "textarea",
        hint: `${LINES_HINT}: name | price | details`,
      },
      {
        key: "images",
        label: "Room photos",
        kind: "images",
        hint: "In the same order as the rooms",
      },
    ],
    defaults: () => ({
      layout: SECTION_LAYOUTS.rooms[0].label,
      eyebrow: "Our Rooms",
      title: "Find Your Perfect Stay",
      subtitle:
        "Choose from our comfortable rooms designed for relaxation and views.",
      items:
        "Deluxe Sea View Room | LKR 18,000 | 2 Guests · 32 m² · Sea view\nStandard Double Room | LKR 12,000 | 2 Guests · 26 m² · Garden view\nFamily Suite | LKR 26,000 | 4 Guests · 45 m² · Balcony",
    }),
  },
  amenities: {
    label: "Amenities",
    icon: Box,
    group: "section",
    fields: [
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      {
        key: "title",
        label: "Heading",
        kind: "text",
        hint: "Leave empty to show only the items",
      },
      {
        key: "items",
        label: "Amenities",
        kind: "textarea",
        hint: `${LINES_HINT}; add "| detail" for feature tiles`,
      },
    ],
    defaults: () => ({
      layout: SECTION_LAYOUTS.amenities[0].label,
      eyebrow: "",
      title: "",
      items:
        "Beach Access | Steps from the sand\nLocal Experiences | Tours and culture\nAuthentic Hospitality | Sri Lankan warmth\nPeaceful & Safe | Quiet and secure",
    }),
  },
  gallery: {
    label: "Gallery",
    icon: Mountain,
    group: "section",
    fields: [
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "title", label: "Heading", kind: "text" },
      { key: "images", label: "Photos", kind: "images" },
    ],
    defaults: () => ({
      layout: SECTION_LAYOUTS.gallery[0].label,
      eyebrow: "Gallery",
      title: "A Look Around",
    }),
  },
  testimonials: {
    label: "Testimonials",
    icon: MessageSquare,
    group: "section",
    fields: [
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "title", label: "Heading", kind: "text" },
      {
        key: "items",
        label: "Reviews",
        kind: "textarea",
        hint: `${LINES_HINT}: quote | guest name | country`,
      },
    ],
    defaults: () => ({
      layout: SECTION_LAYOUTS.testimonials[0].label,
      eyebrow: "Guest Testimonials",
      title: "What Our Guests Say",
      items:
        "An amazing stay! The view, the service and the peaceful atmosphere were perfect. | Sarah M. | United Kingdom\nBeautiful rooms and very friendly staff. Loved the ocean view and fresh breakfast. | Daniel K. | Germany\nThe perfect place to relax by the sea. Everything was clean and well organised. | Priya S. | India",
    }),
  },
  booking: {
    label: "Booking",
    icon: CalendarDays,
    group: "section",
    fields: [
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "title", label: "Heading", kind: "text" },
      { key: "text", label: "Text", kind: "text" },
      {
        key: "items",
        label: "Perks",
        kind: "textarea",
        hint: `${LINES_HINT} (Call to action layout)`,
      },
      { key: "image", label: "Photo", kind: "image" },
      { key: "button", label: "Button text", kind: "text" },
      { key: "buttonLink", label: "Button link", kind: "link" },
    ],
    defaults: () => ({
      layout: SECTION_LAYOUTS.booking[0].label,
      eyebrow: "Book now",
      title: "Plan Your Perfect Stay",
      text: "Check availability and book directly for the best rates.",
      items:
        "Best Rate Guarantee\nExclusive Offers\nFlexible Cancellation\n24/7 Support",
      button: "Check Availability",
      buttonLink: BOOKING_LINK,
    }),
  },
  contact: {
    label: "Contact",
    icon: Globe,
    group: "section",
    fields: [
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "title", label: "Heading", kind: "text" },
      { key: "address", label: "Address", kind: "text" },
      { key: "phone", label: "Phone", kind: "text" },
      { key: "email", label: "Email", kind: "text" },
    ],
    defaults: () => ({
      layout: SECTION_LAYOUTS.contact[0].label,
      eyebrow: "Contact",
      title: "Get in Touch",
      address: "",
      phone: "",
      email: "",
    }),
  },
  heading: {
    label: "Heading",
    icon: BarChart3,
    group: "element",
    fields: [
      { key: "text", label: "Text", kind: "text" },
      {
        key: "size",
        label: "Size",
        kind: "select",
        options: ["Large", "Medium", "Small"],
      },
      {
        key: "align",
        label: "Alignment",
        kind: "select",
        options: ["Left", "Center"],
      },
    ],
    defaults: () => ({ text: "New heading", size: "Large", align: "Left" }),
  },
  text: {
    label: "Text",
    icon: List,
    group: "element",
    fields: [
      { key: "text", label: "Text", kind: "textarea" },
      {
        key: "align",
        label: "Alignment",
        kind: "select",
        options: ["Left", "Center"],
      },
    ],
    defaults: () => ({
      text: "Write something about your property.",
      align: "Left",
    }),
  },
  image: {
    label: "Image",
    icon: ImageIcon,
    group: "element",
    fields: [
      { key: "image", label: "Image", kind: "image" },
      { key: "caption", label: "Caption", kind: "text" },
    ],
    defaults: () => ({ caption: "" }),
  },
  button: {
    label: "Button",
    icon: Link2,
    group: "element",
    fields: [
      { key: "label", label: "Text", kind: "text" },
      {
        key: "style",
        label: "Style",
        kind: "select",
        options: ["Filled", "Outline"],
      },
      {
        key: "align",
        label: "Alignment",
        kind: "select",
        options: ["Left", "Center"],
      },
      { key: "link", label: "Button link", kind: "link" },
    ],
    defaults: () => ({
      label: "Book Now",
      style: "Filled",
      align: "Left",
      link: BOOKING_LINK,
    }),
  },
  video: {
    label: "Video",
    icon: Play,
    group: "element",
    fields: [
      {
        key: "url",
        label: "Video link",
        kind: "text",
        hint: "YouTube or Vimeo",
      },
      { key: "caption", label: "Caption", kind: "text" },
    ],
    defaults: () => ({ url: "", caption: "" }),
  },
  divider: {
    label: "Divider",
    icon: Minus,
    group: "element",
    fields: [],
    defaults: () => ({}),
  },
};

export const BLOCK_TYPES = Object.keys(BLOCKS) as BlockType[];

// Name for a block in lists: some layouts read better under their own name.
export function blockDisplayName(block: BuilderBlock) {
  const { layout = "", items = "" } = block.props;
  if (block.type === "booking")
    return layout === "Call to action" ? "Call to Action" : "Booking Bar";
  if (block.type === "amenities" && layout !== "Tags" && items.includes("|"))
    return "Highlights";
  return BLOCKS[block.type].label;
}

type BlockViewProps = {
  block: BuilderBlock;
  // Photos picked for this block (image fields use the first).
  images: File[];
};

// How a block looks on the site. Colors and fonts come from CSS variables
// set on the canvas; layout follows the canvas width (container queries).
export function BlockView({ block, images }: BlockViewProps) {
  return (
    <BlockContext.Provider value={block}>
      <BlockBody block={block} images={images} />
    </BlockContext.Provider>
  );
}

function BlockBody({ block, images }: BlockViewProps) {
  const p = block.props;
  if (isSection(block.type)) {
    return <SectionView type={block.type} props={p} images={images} />;
  }
  switch (block.type) {
    case "heading": {
      const size =
        p.size === "Small"
          ? "text-xl"
          : p.size === "Medium"
            ? "text-2xl"
            : "text-3xl @3xl:text-4xl";
      return (
        <div
          className={cn(
            "px-6 pt-8 pb-2 @3xl:px-10",
            p.align === "Center" && "text-center",
          )}
        >
          <EditableText
            field="text"
            as="h2"
            defaultLevel="Heading 2"
            placeholder="Heading"
            className={cn(
              "font-(family-name:--site-heading) [font-weight:var(--site-heading-weight,400)] leading-tight text-(--site-text)",
              size,
            )}
          />
        </div>
      );
    }
    case "text":
      return (
        <div
          className={cn(
            "px-6 py-3 @3xl:px-10",
            p.align === "Center" && "text-center",
          )}
        >
          <EditableText
            field="text"
            placeholder="Text"
            className="text-sm leading-relaxed text-(--site-muted) @3xl:text-base"
          />
        </div>
      );
    case "image":
      return (
        <figure className="px-6 py-4 @3xl:px-10">
          <Photo
            file={images[0]}
            className="aspect-[16/9] w-full rounded-(--site-radius)"
            alt={p.imageAlt}
          />
          <EditableText
            field="caption"
            as="span"
            inline
            placeholder="Caption"
            className="mt-2 block text-center text-xs text-(--site-muted)"
          />
        </figure>
      );
    case "button":
      return (
        <div
          className={cn(
            "px-6 py-4 @3xl:px-10",
            p.align === "Center" && "text-center",
          )}
        >
          <SiteButton field="label" outline={p.style === "Outline"} />
        </div>
      );
    case "video":
      return (
        <figure className="px-6 py-4 @3xl:px-10">
          <div className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-(--site-radius) bg-[#0b2240] text-white/80">
            <span className="flex size-14 items-center justify-center rounded-full bg-white/15">
              <Play
                aria-hidden="true"
                className="size-6 fill-white text-white"
              />
            </span>
            <span className="max-w-[80%] truncate text-xs">
              {p.url || "Add a video link"}
            </span>
          </div>
          <EditableText
            field="caption"
            as="span"
            inline
            placeholder="Caption"
            className="mt-2 block text-center text-xs text-(--site-muted)"
          />
        </figure>
      );
    case "divider":
      return (
        <div className="px-6 py-4 @3xl:px-10">
          <hr className="border-(--site-muted)/25" />
        </div>
      );
  }
}
