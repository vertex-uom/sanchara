// MOCK ONLY, logic will live in the NestJS back end.
// Reviews for Palm Breeze Guest House. The 5 newest are fixed; the rest are
// generated (fixed seed) so the rating counts come out at 92 / 24 / 8 / 3 / 1.
// The summary is computed from these reviews, so filters and counts agree.
import { apiError } from "@/lib/api-client/errors";
import { summaryFromDistribution } from "../summary";
import type { ListReviewsParams, Rating, Review, ReviewSort } from "../types";
import type { ReviewsApi } from "./reviews";

export const REVIEWS_PAGE_SIZE = 5;

const FIXED: Review[] = [
  {
    id: "rev-1",
    guestName: "James P.",
    rating: 5,
    comment: "Amazing stay! The room was spotless and the staff were very helpful.",
    createdAt: "2026-10-12T11:20:00+05:30",
    stayFrom: "2026-10-10",
    stayTo: "2026-10-12",
    unitName: "Room 3",
    verifiedStay: true,
  },
  {
    id: "rev-2",
    guestName: "Nisal S.",
    rating: 5,
    comment: "Lovely location and comfortable rooms. Breakfast was great.",
    createdAt: "2026-10-10T16:05:00+05:30",
    stayFrom: "2026-10-07",
    stayTo: "2026-10-10",
    unitName: "Room 2",
    verifiedStay: true,
  },
  {
    id: "rev-3",
    guestName: "Emma C.",
    rating: 5,
    comment: "Beautiful view and a peaceful atmosphere. We would love to come back.",
    createdAt: "2026-10-08T09:40:00+05:30",
    stayFrom: "2026-10-05",
    stayTo: "2026-10-08",
    unitName: "Room 5",
    verifiedStay: true,
  },
  {
    id: "rev-4",
    guestName: "Sahan T.",
    rating: 5,
    comment: "Excellent service, friendly staff and a relaxing weekend.",
    createdAt: "2026-10-04T18:30:00+05:30",
    stayFrom: "2026-10-01",
    stayTo: "2026-10-04",
    unitName: "Room 1",
    verifiedStay: true,
  },
  {
    id: "rev-5",
    guestName: "Luca K.",
    rating: 5,
    comment: "Very clean room and good value for money. Wonderful experience.",
    createdAt: "2026-09-28T12:10:00+05:30",
    stayFrom: "2026-09-25",
    stayTo: "2026-09-28",
    unitName: "Room 4",
    verifiedStay: true,
  },
];

const NAMES = [
  "Amaya R.", "Oliver B.", "Chamari W.", "Noah K.", "Sofia M.", "Kavindu J.", "Mia L.", "Ravi S.", "Hannah T.",
  "Dinesh F.", "Lea H.", "Tharindu G.", "Isabella N.", "Ethan C.", "Nethmi D.", "Marco V.", "Ayesha I.", "Daniel O.",
  "Sanduni E.", "Lucas A.",
];

const COMMENTS: Record<Rating, string[]> = {
  5: [
    "Wonderful hosts and a spotless room. Highly recommended.",
    "Perfect base for exploring Galle Fort. We loved every minute.",
    "Great breakfast, quiet nights and very friendly staff.",
    "The garden is beautiful and the room was very comfortable.",
    "Everything was easy, from check-in to check-out. Thank you!",
  ],
  4: [
    "Comfortable room and helpful staff. The Wi-Fi was a little slow.",
    "Nice stay overall. Breakfast could have more variety.",
    "Good location and clean rooms. A bit of street noise at night.",
  ],
  3: ["The room was fine but the shower pressure was weak.", "Decent stay. Check-in took longer than expected."],
  2: ["The air conditioning was noisy and the room felt small."],
  1: ["Our room was not ready on arrival and we had to wait two hours."],
};

// Small deterministic generator so the mock is the same on every load.
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function generate(): Review[] {
  const random = seeded(2026);
  const ratings: Rating[] = [
    ...Array<Rating>(87).fill(5),
    ...Array<Rating>(24).fill(4),
    ...Array<Rating>(8).fill(3),
    ...Array<Rating>(3).fill(2),
    ...Array<Rating>(1).fill(1),
  ];
  for (let i = ratings.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [ratings[i], ratings[j]] = [ratings[j], ratings[i]];
  }

  // Written on check-out day, going back from 26 Sep 2026 every 1–2 days.
  const day = new Date(Date.UTC(2026, 8, 26));
  return ratings.map((rating, i) => {
    const nights = 1 + Math.floor(random() * 4);
    const stayTo = isoDay(day);
    const from = new Date(day);
    from.setUTCDate(from.getUTCDate() - nights);
    const pool = COMMENTS[rating];
    const review: Review = {
      id: `rev-${i + 6}`,
      guestName: NAMES[i % NAMES.length],
      rating,
      // Some guests leave stars only.
      comment: i % 7 === 3 ? undefined : pool[Math.floor(random() * pool.length)],
      createdAt: `${stayTo}T${String(9 + (i % 10)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}:00+05:30`,
      stayFrom: isoDay(from),
      stayTo,
      unitName: `Room ${1 + Math.floor(random() * 8)}`,
      verifiedStay: true,
    };
    day.setUTCDate(day.getUTCDate() - (1 + (i % 2)));
    return review;
  });
}

const REVIEWS: Review[] = [...FIXED, ...generate()];

function delay() {
  return new Promise<void>((resolve) => setTimeout(resolve, 300 + Math.random() * 300));
}

const SORTS: Record<ReviewSort, (a: Review, b: Review) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  highest: (a, b) => b.rating - a.rating || b.createdAt.localeCompare(a.createdAt),
  lowest: (a, b) => a.rating - b.rating || b.createdAt.localeCompare(a.createdAt),
};

function matches(review: Review, needle: string) {
  return [review.guestName, review.comment ?? "", review.unitName].some((text) => text.toLowerCase().includes(needle));
}

export const mockReviewsApi: ReviewsApi = {
  async getSummary() {
    await delay();
    const distribution: Record<Rating, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const review of REVIEWS) distribution[review.rating] += 1;
    return summaryFromDistribution(distribution);
  },

  async listReviews(_propertyId, params: ListReviewsParams) {
    await delay();
    const offset = params.cursor === undefined ? 0 : Number(params.cursor);
    if (!Number.isInteger(offset) || offset < 0) throw apiError(422, "invalid_cursor", "Reload the page to see reviews.");
    const needle = (params.query ?? "").trim().toLowerCase();
    const matching = REVIEWS.filter((r) => (params.rating === undefined || r.rating === params.rating) && (!needle || matches(r, needle))).sort(
      SORTS[params.sort],
    );
    const page = matching.slice(offset, offset + REVIEWS_PAGE_SIZE);
    const next = offset + page.length;
    return {
      reviews: page.map((r) => ({ ...r })),
      nextCursor: next < matching.length ? String(next) : null,
      total: matching.length,
    };
  },
};
