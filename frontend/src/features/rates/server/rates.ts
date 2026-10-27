import { apiError, type ApiError } from "@/lib/api-client/errors";
import { loadDevStore, saveDevStore } from "@/lib/dev-store";
import { RATE_LIMITS, RESIDENCY_META } from "../config";
import type { RatePlan, RatesView, Residency, RoomTypeOption, Season, TaxLine } from "../types";
import type { RateUpdate } from "../validation";

// Amounts in minor units: plan → residency → room type → column ("base" or a season id).
type Amounts = Record<string, Record<Residency, Record<string, Record<string, number | null>>>>;
type PropertyRates = { plans: RatePlan[]; seasons: Season[]; amounts: Amounts; version: number };
type Store = { byProperty: Record<string, PropertyRates>; nextId: number };

// TEMPORARY dev store so rates can be edited before the rate-plans and
// seasons APIs exist. Replace this file with API calls; the signatures stay.
// Kept on globalThis for hot reload and in .dev-data/rates.json for restarts.
const holder = globalThis as typeof globalThis & { sancharaRatesStore?: Store };
const STORE_NAME = "rates";

// TEMPORARY: room types come from the room-types API later (matches the Reports fixture).
const ROOM_TYPES: RoomTypeOption[] = [
  { id: "deluxe", name: "Deluxe" },
  { id: "standard", name: "Standard" },
];

// TODO(confirm): v8 leaves tax formulas, order and rates open; the platform sets them.
const TAX_LINES: TaxLine[] = [
  { id: "service-charge", name: "Service charge", description: "Charged on the room rate.", rate: null },
  { id: "tdl", name: "Tourism Development Levy (TDL)", description: "Collected for the Sri Lanka Tourism Development Authority.", rate: null },
  { id: "sscl", name: "Social Security Contribution Levy (SSCL)", description: "Government levy on turnover.", rate: null },
  { id: "vat", name: "VAT", description: "Value added tax, for VAT-registered properties.", rate: null },
];

const SEASONS: Season[] = [
  { id: "low", name: "Low season", from: "2026-04-01", to: "2026-06-30" },
  { id: "festival", name: "Festival weeks", from: "2026-07-01", to: "2026-11-30" },
  { id: "peak", name: "Peak season", from: "2026-12-01", to: "2027-02-28" },
];

const PLANS: (RatePlan & { extra: Record<Residency, number> })[] = [
  { id: "standard", name: "Standard rate", description: "Room only.", extra: { resident: 0, "non-resident": 0 } },
  { id: "bed-breakfast", name: "Bed & Breakfast", description: "Room with breakfast.", extra: { resident: 2_500, "non-resident": 10 } },
  { id: "half-board", name: "Half Board", description: "Breakfast and dinner.", extra: { resident: 5_500, "non-resident": 20 } },
  { id: "full-board", name: "Full Board", description: "All three meals.", extra: { resident: 8_500, "non-resident": 30 } },
];

// Design figures for the Standard rate; meal plans add a flat amount per night.
const BASE_FIGURES: Record<Residency, Record<string, Record<string, number | null>>> = {
  resident: {
    deluxe: { base: 18_000, low: 16_000, peak: 26_000, festival: 24_000 },
    standard: { base: 12_000, low: 10_500, peak: 18_000, festival: null },
  },
  "non-resident": {
    deluxe: { base: 60, low: 55, peak: 85, festival: 80 },
    standard: { base: 40, low: 35, peak: 60, festival: null },
  },
};

function seed(): PropertyRates {
  const amounts: Amounts = {};
  for (const plan of PLANS) {
    amounts[plan.id] = { resident: {}, "non-resident": {} };
    for (const residency of ["resident", "non-resident"] as Residency[]) {
      for (const [roomTypeId, columns] of Object.entries(BASE_FIGURES[residency])) {
        amounts[plan.id][residency][roomTypeId] = Object.fromEntries(
          Object.entries(columns).map(([column, value]) => [column, value === null ? null : (value + plan.extra[residency]) * 100]),
        );
      }
    }
  }
  return { plans: PLANS.map(({ id, name, description }) => ({ id, name, description })), seasons: SEASONS, amounts, version: 1 };
}

function store(): Store {
  holder.sancharaRatesStore ??= loadDevStore<Store>(STORE_NAME, () => ({ byProperty: {}, nextId: 1 }));
  return holder.sancharaRatesStore;
}

function ratesOf(propertyId: string) {
  const { byProperty } = store();
  byProperty[propertyId] ??= seed();
  return byProperty[propertyId];
}

const persist = () => saveDevStore(STORE_NAME, store());
const notFound = () => apiError(404, "NOT_FOUND", "That item no longer exists.");
const newId = (prefix: string) => `${prefix}_${store().nextId++}`;

const bySeasonStart = (a: Season, b: Season) => a.from.localeCompare(b.from);

// The grid for one plan and residency. An unknown plan falls back to the first.
export async function getRates(propertyId: string, planId: string | null, residency: Residency): Promise<RatesView & { planId: string }> {
  const data = ratesOf(propertyId);
  const plan = data.plans.find((item) => item.id === planId) ?? data.plans[0];
  const currency = RESIDENCY_META[residency].currency;
  const seasons = data.seasons.toSorted(bySeasonStart);
  const amounts = data.amounts[plan.id]?.[residency] ?? {};
  const grid = Object.fromEntries(
    ROOM_TYPES.map((roomType) => [
      roomType.id,
      Object.fromEntries(
        ["base", ...seasons.map((season) => season.id)].map((column) => {
          const minor = amounts[roomType.id]?.[column];
          return [column, minor == null ? null : { amountMinor: minor, currency }];
        }),
      ),
    ]),
  );
  return { roomTypes: ROOM_TYPES, plans: data.plans, seasons, grid, currency, version: data.version, planId: plan.id };
}

export async function getSeasons(propertyId: string): Promise<Season[]> {
  return ratesOf(propertyId).seasons.toSorted(bySeasonStart);
}

export async function getTaxLines(): Promise<TaxLine[]> {
  return TAX_LINES;
}

export async function updateRates(
  propertyId: string,
  planId: string,
  residency: Residency,
  version: number,
  update: RateUpdate,
): Promise<ApiError | null> {
  const data = ratesOf(propertyId);
  if (!data.plans.some((plan) => plan.id === planId)) return notFound();
  if (data.version !== version) return apiError(409, "STALE", "Rates were changed somewhere else.");
  data.amounts[planId] ??= { resident: {}, "non-resident": {} };
  for (const [roomTypeId, columns] of Object.entries(update)) {
    data.amounts[planId][residency][roomTypeId] = { ...data.amounts[planId][residency][roomTypeId], ...columns };
  }
  data.version += 1;
  persist();
  return null;
}

// Copies another plan's rates when asked, so a meal plan can start from Standard.
export async function createPlan(
  propertyId: string,
  input: { name: string; description: string; copyFrom: string | null },
): Promise<{ id: string } | ApiError> {
  const data = ratesOf(propertyId);
  if (data.plans.length >= RATE_LIMITS.maxPlans) return apiError(409, "LIMIT", "Too many rate plans.");
  const id = newId("plan");
  data.plans.push({ id, name: input.name, description: input.description });
  const source = input.copyFrom ? data.amounts[input.copyFrom] : undefined;
  data.amounts[id] = source ? structuredClone(source) : { resident: {}, "non-resident": {} };
  data.version += 1;
  persist();
  return { id };
}

export async function getPlanNames(propertyId: string) {
  return ratesOf(propertyId).plans.map((plan) => plan.name);
}

export async function getOtherSeasons(propertyId: string, exceptId: string | null) {
  return ratesOf(propertyId).seasons.filter((season) => season.id !== exceptId);
}

export async function saveSeason(propertyId: string, seasonId: string | null, input: Omit<Season, "id">): Promise<ApiError | null> {
  const data = ratesOf(propertyId);
  if (seasonId) {
    const season = data.seasons.find((item) => item.id === seasonId);
    if (!season) return notFound();
    Object.assign(season, input);
  } else {
    data.seasons.push({ id: newId("season"), ...input });
  }
  data.version += 1;
  persist();
  return null;
}

// Its rates go too; those dates then use the base rate.
export async function deleteSeason(propertyId: string, seasonId: string): Promise<ApiError | null> {
  const data = ratesOf(propertyId);
  if (!data.seasons.some((season) => season.id === seasonId)) return notFound();
  data.seasons = data.seasons.filter((season) => season.id !== seasonId);
  for (const residencies of Object.values(data.amounts)) {
    for (const roomTypes of Object.values(residencies)) {
      for (const columns of Object.values(roomTypes)) delete columns[seasonId];
    }
  }
  data.version += 1;
  persist();
  return null;
}
