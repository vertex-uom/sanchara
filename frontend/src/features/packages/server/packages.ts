import { apiError, type ApiError } from "@/lib/api-client/errors";
import type { Money } from "@/lib/format/money";
import type { PackageFilters } from "../package-params";
import type { PackageDay, PackageDetail, PackageItem, PackageList, PackageSummary, PackageTotals } from "../types";
import type { NewPackage, ValidPackage } from "../validation";

type StoredPackage = Omit<PackageDetail, "totals">;
type Store = { byProperty: Record<string, StoredPackage[]>; nextId: number };

// TEMPORARY in-memory dev store so the page works end to end before the
// packages API exists. Replace this file with API calls; the signatures stay.
// Kept on globalThis so hot reload doesn't reset it; a server restart does.
const holder = globalThis as typeof globalThis & { sancharaPackageStore?: Store };

// Stand-in for the API's pricing; the real totals and exchange rate come from it.
const FIXTURE_LKR_PER_USD = 325;

const lkr = (rupees: number): Money => ({ amountMinor: rupees * 100, currency: "LKR" });

function item(id: string, fields: Omit<PackageItem, "id" | "price" | "availability"> & { rupees?: number }): PackageItem {
  const { rupees, ...rest } = fields;
  return {
    id,
    ...rest,
    price: rest.payment === "online" && rupees ? lkr(rupees) : null,
    availability: rest.kind === "room" ? "available" : null,
  };
}

function seed(): StoredPackage[] {
  return [
    {
      id: "pkg_surf",
      name: "3-Night Surf Camp",
      tagline: "For surf lovers, with airport transfer and lessons",
      theme: "surf",
      status: "active",
      nights: 3,
      version: 1,
      days: [
        {
          id: "day_s1",
          title: "Day 1",
          note: "Arrival",
          items: [
            item("itm_s1", { kind: "room", name: "Standard room", description: "3 nights (Day 1 – Day 3)", payment: "online", rupees: 27_000 }),
            item("itm_s2", { kind: "meal", name: "Welcome dinner", description: "Local Sri Lankan dinner", payment: "property" }),
            item("itm_s3", { kind: "transfer", name: "Airport transfer", description: "Colombo Airport to property", payment: "online", rupees: 6_000 }),
          ],
        },
        {
          id: "day_s2",
          title: "Day 2",
          note: "Surf & explore",
          items: [
            item("itm_s4", { kind: "activity", name: "Morning surf lesson", description: "2-hour lesson with instructor", payment: "online", rupees: 6_000 }),
            item("itm_s5", { kind: "meal", name: "Lunch at the beach", description: "Set menu", payment: "property" }),
          ],
        },
        {
          id: "day_s3",
          title: "Day 3",
          note: "Relax & depart",
          items: [
            item("itm_s6", { kind: "activity", name: "Guided surf session", description: "Morning session", payment: "online", rupees: 6_000 }),
            item("itm_s7", { kind: "meal", name: "Farewell lunch", description: "Local cuisine", payment: "property" }),
          ],
        },
      ],
    },
    {
      id: "pkg_wellness",
      name: "Wellness Weekend",
      tagline: "Yoga, Ayurveda treatments and slow mornings",
      theme: "wellness",
      status: "active",
      nights: 2,
      version: 1,
      days: [
        {
          id: "day_w1",
          title: "Day 1",
          note: "Arrive & unwind",
          items: [
            item("itm_w1", { kind: "room", name: "Garden room", description: "2 nights (Day 1 – Day 2)", payment: "online", rupees: 24_000 }),
            item("itm_w2", { kind: "activity", name: "Sunset yoga", description: "1-hour group class", payment: "online", rupees: 4_000 }),
          ],
        },
        {
          id: "day_w2",
          title: "Day 2",
          note: "Treatments",
          items: [
            item("itm_w3", { kind: "activity", name: "Ayurveda massage", description: "60-minute full body treatment", payment: "online", rupees: 8_000 }),
            item("itm_w4", { kind: "meal", name: "Herbal breakfast", description: "Kola kanda and fresh fruit", payment: "property" }),
          ],
        },
      ],
    },
    {
      id: "pkg_hill",
      name: "Hill Country Escape",
      tagline: "Tea estates, waterfalls and the train to Ella",
      theme: "hill-country",
      status: "draft",
      nights: 3,
      version: 1,
      days: [
        {
          id: "day_h1",
          title: "Day 1",
          note: "Arrival",
          items: [
            item("itm_h1", { kind: "room", name: "Deluxe room", description: "3 nights (Day 1 – Day 3)", payment: "online", rupees: 30_000 }),
            item("itm_h2", { kind: "transfer", name: "Station pick-up", description: "Ella station to property", payment: "online", rupees: 3_000 }),
          ],
        },
        {
          id: "day_h2",
          title: "Day 2",
          note: "Tea country",
          items: [
            item("itm_h3", { kind: "activity", name: "Tea estate tour", description: "Half-day guided tour", payment: "online", rupees: 5_000 }),
            item("itm_h4", { kind: "meal", name: "Picnic lunch", description: "Packed lunch", payment: "property" }),
          ],
        },
      ],
    },
  ];
}

function store(): Store {
  // Only the first sample property has packages, so the empty state can be seen on the other.
  holder.sancharaPackageStore ??= { byProperty: { "palm-breeze": seed() }, nextId: 1 };
  return holder.sancharaPackageStore;
}

function packagesOf(propertyId: string) {
  const { byProperty } = store();
  byProperty[propertyId] ??= [];
  return byProperty[propertyId];
}

function totals(days: PackageDay[]): PackageTotals {
  const items = days.flatMap((day) => day.items);
  const minor = items.reduce((sum, entry) => sum + (entry.price?.amountMinor ?? 0), 0);
  return {
    payOnline: { amountMinor: minor, currency: "LKR" },
    payOnlineUsd: { amountMinor: Math.round(minor / FIXTURE_LKR_PER_USD / 100) * 100, currency: "USD" },
    hasPayAtProperty: items.some((entry) => entry.payment === "property"),
  };
}

const withTotals = (stored: StoredPackage): PackageDetail => ({ ...stored, totals: totals(stored.days) });

function newId(prefix: string) {
  return `${prefix}_new${store().nextId++}`;
}

export async function listPackages(propertyId: string, { status, q }: PackageFilters): Promise<PackageList> {
  const query = q.toLowerCase();
  const searched = packagesOf(propertyId).filter(
    (stored) => !query || stored.name.toLowerCase().includes(query) || stored.tagline.toLowerCase().includes(query),
  );
  const summaries = searched
    .filter((stored) => !status || stored.status === status)
    .map((stored): PackageSummary => ({
      id: stored.id,
      name: stored.name,
      theme: stored.theme,
      status: stored.status,
      nights: stored.nights,
      fromPrice: totals(stored.days).payOnline,
    }));
  return {
    packages: summaries,
    counts: {
      all: searched.length,
      active: searched.filter((stored) => stored.status === "active").length,
      draft: searched.filter((stored) => stored.status === "draft").length,
    },
  };
}

export async function getPackage(propertyId: string, packageId: string): Promise<PackageDetail | null> {
  const stored = packagesOf(propertyId).find((entry) => entry.id === packageId);
  return stored ? withTotals(stored) : null;
}

// New packages start as a draft with an empty first day.
export async function createPackage(propertyId: string, input: NewPackage): Promise<{ id: string }> {
  const id = newId("pkg");
  packagesOf(propertyId).unshift({
    id,
    ...input,
    tagline: "",
    status: "draft",
    version: 1,
    days: [{ id: newId("day"), title: "Day 1", note: "Arrival", items: [] }],
  });
  return { id };
}

export async function deletePackage(propertyId: string, packageId: string): Promise<ApiError | null> {
  const packages = packagesOf(propertyId);
  const index = packages.findIndex((entry) => entry.id === packageId);
  if (index === -1) return apiError(404, "NOT_FOUND", "That package no longer exists.");
  packages.splice(index, 1);
  return null;
}

// Replaces the package's details and itinerary. Ids the store doesn't know
// (new rows from the editor) get fresh ones; known rooms keep their availability.
export async function updatePackage(
  propertyId: string,
  packageId: string,
  version: number,
  input: ValidPackage,
): Promise<ApiError | null> {
  const packages = packagesOf(propertyId);
  const index = packages.findIndex((entry) => entry.id === packageId);
  const current = packages[index];
  if (!current) return apiError(404, "NOT_FOUND", "That package no longer exists.");
  if (current.version !== version) return apiError(409, "STALE", "This package was changed somewhere else.");

  const known = new Map(current.days.flatMap((day) => day.items).map((entry) => [entry.id, entry]));
  const knownDays = new Set(current.days.map((day) => day.id));
  packages[index] = {
    ...current,
    name: input.name,
    tagline: input.tagline,
    status: input.status,
    nights: input.nights,
    version: current.version + 1,
    days: input.days.map((day) => ({
      id: knownDays.has(day.id) ? day.id : newId("day"),
      title: day.title,
      note: day.note,
      items: day.items.map((entry): PackageItem => {
        const previous = known.get(entry.id);
        return {
          id: previous ? entry.id : newId("itm"),
          kind: entry.kind,
          name: entry.name,
          description: entry.description,
          payment: entry.payment,
          price: entry.priceRupees === null ? null : lkr(entry.priceRupees),
          availability: entry.kind !== "room" ? null : previous?.kind === "room" ? previous.availability : "available",
        };
      }),
    })),
  };
  return null;
}
