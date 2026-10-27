import {
  Building2,
  Compass,
  File,
  Image as ImageIcon,
  Mail,
  BedDouble,
  type LucideIcon,
} from "lucide-react";
import type { BlockType } from "./builder-blocks";

export type PageTemplate = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  // Suggested page name; the URL follows it.
  name: string;
  // Sections the page starts with: block defaults plus these props.
  sections: { type: BlockType; props?: Record<string, string> }[];
};

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: "blank",
    label: "Blank page",
    description: "Start empty",
    icon: File,
    name: "New page",
    sections: [],
  },
  {
    id: "rooms",
    label: "Rooms list",
    description: "All rooms with prices",
    icon: BedDouble,
    name: "Rooms",
    sections: [
      {
        type: "hero",
        props: {
          layout: "Centered",
          eyebrow: "Stay with us",
          title: "Our Rooms",
          subtitle: "",
          button: "",
        },
      },
      { type: "rooms", props: { layout: "List" } },
      { type: "booking", props: { layout: "Availability bar" } },
    ],
  },
  {
    id: "room-details",
    label: "Room details",
    description: "One room, photos & booking",
    icon: Building2,
    name: "Deluxe Room",
    sections: [
      {
        type: "hero",
        props: {
          layout: "Split",
          eyebrow: "From LKR 18,000 / night",
          title: "Deluxe Sea View Room",
          subtitle: "2 Guests · 32 m² · Sea view",
          button: "Book this room",
        },
      },
      {
        type: "gallery",
        props: { layout: "Mosaic", eyebrow: "", title: "Room photos" },
      },
      {
        type: "amenities",
        props: {
          layout: "Tags",
          title: "In this room",
          items:
            "Air conditioning\nOcean view\nBalcony\nFree Wi-Fi\nHot water\nSmart TV",
        },
      },
      {
        type: "booking",
        props: { layout: "Availability bar", title: "Book this room" },
      },
    ],
  },
  {
    id: "gallery",
    label: "Gallery",
    description: "Photo grid & albums",
    icon: ImageIcon,
    name: "Gallery",
    sections: [
      {
        type: "hero",
        props: {
          layout: "Centered",
          eyebrow: "",
          title: "Gallery",
          subtitle: "A look around our home",
          button: "",
        },
      },
      {
        type: "gallery",
        props: { layout: "Mosaic", eyebrow: "", title: "Rooms & spaces" },
      },
      {
        type: "gallery",
        props: { layout: "Grid", eyebrow: "", title: "Around us" },
      },
    ],
  },
  {
    id: "experiences",
    label: "Experiences",
    description: "Tours & local activities",
    icon: Compass,
    name: "Experiences",
    sections: [
      {
        type: "hero",
        props: {
          layout: "Centered",
          eyebrow: "",
          title: "Experiences",
          subtitle: "Make the most of your stay",
          button: "",
        },
      },
      {
        type: "amenities",
        props: {
          layout: "Icon grid",
          title: "Things to do",
          items:
            "Whale Watching | Morning boat trips\nFort Walks | Guided heritage tours\nSurf Lessons | For every level\nCooking Class | Learn Sri Lankan dishes",
        },
      },
      {
        type: "booking",
        props: { layout: "Call to action", title: "Plan your trip with us" },
      },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    description: "Map & contact details",
    icon: Mail,
    name: "Contact",
    sections: [
      { type: "contact", props: { layout: "Details + map" } },
      { type: "booking", props: { layout: "Availability bar" } },
    ],
  },
];
