import { colomboDateKey } from "@/lib/format/dates";

export type DailyCount = { date: string; count: number };

// Website traffic for the published template site, as the analytics API
// will return it. Shares are 0–1; changes compare with the 30 days before.
export type WebsiteAnalytics = {
  visitors: { days: DailyCount[]; change: number };
  bookingClicks: { days: DailyCount[]; change: number };
  trafficSources: { label: string; share: number }[];
  devices: { label: "Mobile" | "Desktop" | "Tablet"; share: number }[];
  // Views in the last 30 days, by menu page name.
  pageViews: Record<string, number>;
  health: { score: number; checks: { label: string; passed: boolean }[] };
};

const DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

// TEMPORARY fixture. Replace the body with the website analytics API call
// once the API client exists; the return type stays the same.
export async function getWebsiteAnalytics(): Promise<WebsiteAnalytics> {
  const today = Date.parse(`${colomboDateKey(new Date())}T00:00:00Z`);
  const days = Array.from({ length: DAYS }, (_, index) => {
    const date = new Date(today - (DAYS - 1 - index) * DAY_MS)
      .toISOString()
      .slice(0, 10);
    // A gentle upward trend with a weekly wobble.
    const count = Math.round(28 + index * 0.95 + 6 * Math.sin(index / 1.6));
    return { date, count };
  });

  return {
    visitors: { days, change: 0.18 },
    bookingClicks: {
      days: days.map(({ date, count }) => ({
        date,
        count: Math.round(count * 0.075),
      })),
      change: 0.12,
    },
    trafficSources: [
      { label: "Google search", share: 0.54 },
      { label: "Direct", share: 0.22 },
      { label: "Social media", share: 0.16 },
      { label: "Other", share: 0.08 },
    ],
    devices: [
      { label: "Mobile", share: 0.68 },
      { label: "Desktop", share: 0.26 },
      { label: "Tablet", share: 0.06 },
    ],
    pageViews: {
      Home: 2410,
      Rooms: 1186,
      Booking: 958,
      Gallery: 812,
      Reviews: 520,
      Contact: 391,
      Offers: 214,
      Blog: 168,
      "Things to do": 276,
    },
    health: {
      score: 92,
      checks: [
        { label: "Mobile friendly", passed: true },
        { label: "SSL secured", passed: true },
        { label: "Fast loading", passed: true },
      ],
    },
  };
}
