import type { ABOUT_ICONS } from "./icons";

export type AboutIcon = keyof typeof ABOUT_ICONS;

export type IconItem = { icon: AboutIcon; title: string; text: string };

export type CtaLink = { label: string; href: string | null };

// Everything on /about. The platform team edits it without code changes.
export type AboutContent = {
  hero: { titleLead: string; titleAccent: string; body: string; primary: CtaLink; secondary: CtaLink };
  story: {
    title: string;
    paragraphs: string[];
    quote: { text: string; author: string; role: string };
  };
  pillars: { title: string; text: string }[];
  differentiators: { title: string; intro: string; items: IconItem[] };
  howItWorks: { title: string; intro: string; steps: IconItem[]; afterBookingTitle: string; afterBooking: IconItem[] };
  safety: {
    title: string;
    intro: string;
    groups: { icon: AboutIcon; title: string; points: string[] }[];
    paymentBadges: string[];
    links: CtaLink[];
  };
  numbers: { title: string; stats: { value: string; label: string }[] };
  destinations: {
    title: string;
    // position: map pin in the About hero (lat/lng, on the island's coastline outline).
    items: { name: string; region: string; imageUrl: string; position: { lat: number; lng: number } }[];
    topRatedTitle: string;
  };
  voices: {
    title: string;
    testimonials: { quote: string; name: string; country: string; stayedAt: string }[];
    rating: {
      average: number;
      reviewCountLabel: string;
      // 5 stars first; ratios come from the API.
      distribution: { stars: number; ratio: number }[];
    };
    moreReviews: CtaLink;
  };
  values: {
    title: string;
    items: IconItem[];
    commitments: { icon: AboutIcon; title: string; paragraphs: string[] }[];
  };
  cta: { title: string; body: string; primary: CtaLink; secondary: CtaLink };
  organization: { legalName: string; email: string; telephone: string; addressLocality: string; addressCountry: string };
};
