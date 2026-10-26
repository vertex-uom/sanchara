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
import { cn } from "cn";
import { Photo, SiteButton } from "./block-parts";
import {
  layoutLabels,
  SECTION_LAYOUTS,
  type SectionType,
} from "./section-layouts";
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
  kind: "text" | "textarea" | "select" | "image" | "images";
  options?: string[];
  hint?: string;
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

function layoutField(type: SectionType): FieldDef {
  return {
    key: "layout",
    label: "Layout",
    kind: "select",
    options: layoutLabels(type),
  };
}

export function isSection(type: BlockType): type is SectionType {
  return type in SECTION_LAYOUTS;
}

export const BLOCKS: Record<BlockType, BlockDef> = {
  hero: {
    label: "Hero",
    icon: ImageIcon,
    group: "section",
    fields: [
      layoutField("hero"),
      { key: "eyebrow", label: "Small heading", kind: "text" },
      { key: "title", label: "Title", kind: "text" },
      { key: "subtitle", label: "Subtitle", kind: "text" },
      { key: "button", label: "Button text", kind: "text" },
      {
        key: "images",
        label: "Photos",
        kind: "images",
        hint: "The first photo shows first; Slider uses them all",
      },
    ],
    defaults: ({ name, tagline }) => ({
      layout: SECTION_LAYOUTS.hero[0].label,
      eyebrow: `Welcome to ${name}`,
      title: "A Peaceful Stay by the Coast",
      subtitle: tagline || "Relax. Explore. Feel at Home.",
      button: "Book Your Stay",
    }),
  },
  about: {
    label: "About",
    icon: FileText,
    group: "section",
    fields: [
      layoutField("about"),
      { key: "eyebrow", label: "Small heading", kind: "text" },
      { key: "title", label: "Title", kind: "text" },
      { key: "text", label: "Text", kind: "textarea" },
      { key: "image", label: "Photo", kind: "image" },
    ],
    defaults: ({ name }) => ({
      layout: SECTION_LAYOUTS.about[0].label,
      eyebrow: "About us",
      title: "Your Home Away From Home",
      text: `${name} offers comfortable rooms, warm hospitality and easy access to everything nearby.`,
    }),
  },
  rooms: {
    label: "Rooms",
    icon: BedDouble,
    group: "section",
    fields: [
      layoutField("rooms"),
      { key: "title", label: "Title", kind: "text" },
      {
        key: "items",
        label: "Rooms",
        kind: "textarea",
        hint: `${LINES_HINT}: name | price`,
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
      title: "Our Rooms",
      items:
        "Deluxe Room | LKR 18,500\nStandard Room | LKR 12,000\nFamily Suite | LKR 26,000",
    }),
  },
  amenities: {
    label: "Amenities",
    icon: Box,
    group: "section",
    fields: [
      layoutField("amenities"),
      { key: "title", label: "Title", kind: "text" },
      { key: "items", label: "Amenities", kind: "textarea", hint: LINES_HINT },
    ],
    defaults: () => ({
      layout: SECTION_LAYOUTS.amenities[0].label,
      title: "Amenities",
      items:
        "Free Wi-Fi\nSwimming pool\nFree parking\nRestaurant\nAir conditioning\nAirport shuttle",
    }),
  },
  gallery: {
    label: "Gallery",
    icon: Mountain,
    group: "section",
    fields: [
      layoutField("gallery"),
      { key: "title", label: "Title", kind: "text" },
      { key: "images", label: "Photos", kind: "images" },
    ],
    defaults: () => ({
      layout: SECTION_LAYOUTS.gallery[0].label,
      title: "Gallery",
    }),
  },
  testimonials: {
    label: "Testimonials",
    icon: MessageSquare,
    group: "section",
    fields: [
      layoutField("testimonials"),
      { key: "title", label: "Title", kind: "text" },
      {
        key: "items",
        label: "Reviews",
        kind: "textarea",
        hint: `${LINES_HINT}: quote | guest name`,
      },
    ],
    defaults: () => ({
      layout: SECTION_LAYOUTS.testimonials[0].label,
      title: "What Our Guests Say",
      items:
        "Beautiful rooms and the friendliest hosts. | Emma W.\nPeaceful, spotless and close to the beach. | Ravi K.",
    }),
  },
  booking: {
    label: "Booking",
    icon: CalendarDays,
    group: "section",
    fields: [
      layoutField("booking"),
      { key: "title", label: "Title", kind: "text" },
      { key: "text", label: "Text", kind: "text" },
      { key: "button", label: "Button text", kind: "text" },
    ],
    defaults: () => ({
      layout: SECTION_LAYOUTS.booking[0].label,
      title: "Ready for your stay?",
      text: "Check availability and book directly for the best rates.",
      button: "Check availability",
    }),
  },
  contact: {
    label: "Contact",
    icon: Globe,
    group: "section",
    fields: [
      layoutField("contact"),
      { key: "title", label: "Title", kind: "text" },
      { key: "address", label: "Address", kind: "text" },
      { key: "phone", label: "Phone", kind: "text" },
      { key: "email", label: "Email", kind: "text" },
    ],
    defaults: () => ({
      layout: SECTION_LAYOUTS.contact[0].label,
      title: "Contact Us",
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
    ],
    defaults: () => ({ label: "Book Now", style: "Filled", align: "Left" }),
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

type BlockViewProps = {
  block: BuilderBlock;
  // Photos picked for this block (image fields use the first).
  images: File[];
};

// How a block looks on the site. Colors and fonts come from CSS variables
// set on the canvas; layout follows the canvas width (container queries).
export function BlockView({ block, images }: BlockViewProps) {
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
          <h2
            className={cn(
              "font-(family-name:--site-heading) leading-tight text-(--site-text)",
              size,
            )}
          >
            {p.text}
          </h2>
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
          <p className="text-sm leading-relaxed whitespace-pre-line text-(--site-muted) @3xl:text-base">
            {p.text}
          </p>
        </div>
      );
    case "image":
      return (
        <figure className="px-6 py-4 @3xl:px-10">
          <Photo file={images[0]} className="aspect-[16/9] w-full rounded-xl" />
          {p.caption ? (
            <figcaption className="mt-2 text-center text-xs text-(--site-muted)">
              {p.caption}
            </figcaption>
          ) : null}
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
          <SiteButton outline={p.style === "Outline"}>
            {p.label || "Button"}
          </SiteButton>
        </div>
      );
    case "video":
      return (
        <figure className="px-6 py-4 @3xl:px-10">
          <div className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-xl bg-[#0b2240] text-white/80">
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
          {p.caption ? (
            <figcaption className="mt-2 text-center text-xs text-(--site-muted)">
              {p.caption}
            </figcaption>
          ) : null}
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
