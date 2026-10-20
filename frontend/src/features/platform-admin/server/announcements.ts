import { connection } from "next/server";
import type { Announcement, AnnouncementStatus, Paged } from "../types";
import { DAY_MS, dayKey } from "./fixtures";

// TEMPORARY fixtures for Announcements. Replace each exported function with
// the platform-admin API call once it exists; the return types stay the
// same. Windows are anchored to today so the Active / Scheduled / Archived
// split stays meaningful; the status is derived from the window exactly as
// the API will do it.

export const ANNOUNCEMENT_PAGE_SIZE = 8;

const HOUR_MS = 60 * 60 * 1000;

type Seed = Omit<Announcement, "status" | "startsAt" | "endsAt" | "createdAt" | "archivedAt"> & {
  // Offsets in days from the start of today (Sri Lanka time); fractions are
  // hours. `end` null = open-ended; `archived` = closed early by an admin.
  start: number;
  end: number | null;
  archived?: number;
};

const SEEDS: Seed[] = [
  // Active now
  { id: "ann_14", title: "New: Website Builder templates", message: "Four site templates are now available when you ask us to build your company website. Open Website in Back Office to request one.", type: "feature", audience: "owners", channels: ["in-app", "email"], dismissible: true, createdBy: "Admin User", start: 0, end: 14 },
  { id: "ann_13", title: "Maintenance: PayHere gateway, 22 Oct 02:00–04:00", message: "Card payments through PayHere will be unavailable on 22 Oct between 02:00 and 04:00 (GMT+5:30). Bookings continue; payments made in that window are retried automatically.", type: "maintenance", audience: "all-staff", channels: ["in-app"], dismissible: false, createdBy: "Ruwan Perera", start: -2, end: 2 - 5 / 24 },
  { id: "ann_12", title: "Policy update: content guidelines", message: "Property descriptions and photos must follow the updated content guidelines from 15 Nov. Listings that do not comply will be hidden from the directory until fixed.", type: "policy", audience: "managers", channels: ["in-app", "email"], dismissible: true, createdBy: "Kamala Silva", start: -5, end: 26 },
  { id: "ann_11", title: "Reminder: subscription renewals on 1 Nov", message: "Monthly subscriptions renew on 1 Nov. Make sure the card on file is valid: a failed renewal blocks access the same day.", type: "reminder", audience: "owners", channels: ["email"], dismissible: true, createdBy: "Admin User", start: -1, end: 12 },
  // Scheduled
  { id: "ann_17", title: "Urgent: change your password if you reused it elsewhere", message: "A third-party service used by several Sri Lankan travel sites was breached. If your Back Office password is reused anywhere, change it today.", type: "urgent", audience: "all-staff", channels: ["in-app", "email"], dismissible: false, createdBy: "Nimal Perera", start: 1, end: 8 },
  { id: "ann_16", title: "Maintenance: database upgrade, 2 Nov 01:00–03:00", message: "Back Office and company websites will be read-only on 2 Nov between 01:00 and 03:00 (GMT+5:30). Guests can browse; new bookings resume at 03:00.", type: "maintenance", audience: "all-staff", channels: ["in-app"], dismissible: false, createdBy: "Ruwan Perera", start: 9, end: 13 - 6 / 24 },
  { id: "ann_15", title: "New: arrivals board for front desk", message: "From 10 Nov the Front Desk home shows today's arrivals and departures with ID-check status.", type: "feature", audience: "front-desk", channels: ["in-app"], dismissible: true, createdBy: "Kamala Silva", start: 21, end: 35 },
  // Archived (expired or closed early)
  { id: "ann_10", title: "Maintenance: PayHere gateway, 8 Oct", message: "Card payments were unavailable on 8 Oct between 02:00 and 03:30 (GMT+5:30).", type: "maintenance", audience: "all-staff", channels: ["in-app"], dismissible: false, createdBy: "Ruwan Perera", start: -14 - 7 / 24, end: -14 - 5.5 / 24 },
  { id: "ann_9", title: "Reminder: submit tax documents by 30 Sept", message: "Owners must upload the 2025/26 tax documents in Billing before 30 Sept.", type: "reminder", audience: "owners", channels: ["in-app", "email"], dismissible: true, createdBy: "Admin User", start: -40, end: -20 },
  { id: "ann_8", title: "New: WhatsApp confirmations", message: "Guests now receive booking confirmations on WhatsApp when they share a number.", type: "feature", audience: "all-staff", channels: ["in-app", "email"], dismissible: true, createdBy: "Kamala Silva", start: -48, end: -34 },
  { id: "ann_7", title: "Policy update: cancellation rules for non-resident rates", message: "USD rate plans must state the cancellation window in the rate description.", type: "policy", audience: "managers", channels: ["email"], dismissible: true, createdBy: "Nimal Perera", start: -60, end: -30 },
  { id: "ann_6", title: "Urgent: phishing emails pretending to be Sanchara", message: "Emails asking you to “verify your payout account” are not from us. We never ask for your password.", type: "urgent", audience: "all-staff", channels: ["in-app", "email"], dismissible: false, createdBy: "Nimal Perera", start: -75, end: -61, archived: -68 },
  { id: "ann_5", title: "Maintenance: image storage migration", message: "Property photos were briefly unavailable on 1 Aug during a storage migration.", type: "maintenance", audience: "all-staff", channels: ["in-app"], dismissible: false, createdBy: "Ruwan Perera", start: -82, end: -80 },
  { id: "ann_4", title: "New: seasonal pricing", message: "Rate plans can now have seasons with their own prices and minimum stays.", type: "feature", audience: "owners", channels: ["in-app", "email"], dismissible: true, createdBy: "Admin User", start: -110, end: -96 },
  { id: "ann_3", title: "Reminder: keep your property address up to date", message: "Guests find you on the map through the address in Properties; check it after any move.", type: "reminder", audience: "managers", channels: ["in-app"], dismissible: true, createdBy: "Kamala Silva", start: -130, end: -116 },
  { id: "ann_2", title: "Policy update: review responses", message: "Owner responses to guest reviews must not include guest contact details.", type: "policy", audience: "owners", channels: ["email"], dismissible: true, createdBy: "Nimal Perera", start: -160, end: -130 },
  { id: "ann_1", title: "Welcome to the new Back Office", message: "The redesigned Back Office is live for every company. Your data and bookings are unchanged.", type: "feature", audience: "all-staff", channels: ["in-app", "email"], dismissible: true, createdBy: "Admin User", start: -200, end: -170 },
];

let cache: { now: number; items: Announcement[] } | null = null;

// Start of today in Sri Lanka time, so dates are stable within a day.
function startOfToday(now: number) {
  const [y, m, d] = dayKey(now).split("-").map(Number);
  return Date.UTC(y, m - 1, d) - 5.5 * HOUR_MS;
}

function allAnnouncements(now: number): Announcement[] {
  if (cache && dayKey(cache.now) === dayKey(now)) return cache.items;

  const base = startOfToday(now) + 9 * HOUR_MS; // 09:00 local
  const at = (days: number) => new Date(base + days * DAY_MS).toISOString();
  const items = SEEDS.map(({ start, end, archived, ...seed }): Announcement => {
    const startsAt = at(start);
    const endsAt = end === null ? null : at(end);
    const archivedAt = archived === undefined ? null : at(archived);
    const status: AnnouncementStatus = archivedAt || (endsAt && new Date(endsAt).getTime() <= now) ? "archived" : new Date(startsAt).getTime() > now ? "scheduled" : "active";
    return { ...seed, status, startsAt, endsAt, archivedAt, createdAt: at(start - 2) };
  });
  cache = { now, items };
  return items;
}

export type AnnouncementCounts = Record<AnnouncementStatus, number>;

export async function getAnnouncementCounts(): Promise<AnnouncementCounts> {
  await connection();
  const all = allAnnouncements(Date.now());
  const count = (status: AnnouncementStatus) => all.filter((a) => a.status === status).length;
  return { active: count("active"), scheduled: count("scheduled"), archived: count("archived") };
}

// Active: newest start first. Scheduled: soonest first. Archived: most
// recently ended first.
export async function listAnnouncements(status: AnnouncementStatus, page: number): Promise<Paged<Announcement>> {
  await connection();
  const items = allAnnouncements(Date.now())
    .filter((a) => a.status === status)
    .sort((a, b) => {
      if (status === "scheduled") return a.startsAt.localeCompare(b.startsAt);
      if (status === "archived") return (b.archivedAt ?? b.endsAt ?? "").localeCompare(a.archivedAt ?? a.endsAt ?? "");
      return b.startsAt.localeCompare(a.startsAt);
    });
  const start = (page - 1) * ANNOUNCEMENT_PAGE_SIZE;
  return { items: items.slice(start, start + ANNOUNCEMENT_PAGE_SIZE), total: items.length, page, pageSize: ANNOUNCEMENT_PAGE_SIZE };
}

export async function getAnnouncement(id: string): Promise<Announcement | null> {
  await connection();
  return allAnnouncements(Date.now()).find((a) => a.id === id) ?? null;
}

// For the Overview card.
export async function getActiveAnnouncements(limit = 4): Promise<Announcement[]> {
  const { items } = await listAnnouncements("active", 1);
  return items.slice(0, limit);
}
