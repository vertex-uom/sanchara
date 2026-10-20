import { connection } from "next/server";
import type {
  AccountKpi,
  CompanyAccount,
  CompanyAccountDetail,
  CompanyAccountStatus,
  CompanyFilters,
  CompanyPlan,
  EnforcementEntry,
  Paged,
  WebsiteRequest,
} from "../types";
import { DAY_MS, dayKey, FIRST_NAMES, LAST_NAMES, mulberry32, pick, slugify } from "./fixtures";

export const COMPANY_PAGE_SIZE = 8;

const TOTAL = 312;
// Matches the Overview "Staff" KPI.
const TOTAL_STAFF = 1148;

// --- Vocabulary ---------------------------------------------------------------

// prettier-ignore
const PREFIXES = ["Sea View", "Palm Breeze", "Lagoon View", "Hill Country", "Coral Reef", "Tea Hill", "Ocean Breeze", "Misty Peak", "Cinnamon Garden", "Coconut Grove", "Jungle Edge", "Blue Whale", "Lotus Pond", "Mango Tree", "Sapphire Bay", "Kingfisher", "Monsoon", "Elephant Rock", "Turtle Bay", "Golden Sands", "Paddy Field", "Lighthouse", "Spice Garden", "River Bend", "Rainforest", "Sunset Point", "Harbour", "Temple View", "Dune", "Surf Point", "Banyan", "Frangipani", "Heritage", "Lakeside", "Cliff Top", "Fort", "Waterfall", "Orchid", "Pearl", "Breeze"];
const SUFFIXES = ["Villa", "Resort", "Guest House", "Rooms", "Cabins", "Lodge", "Retreat", "Homestay", "Boutique Hotel", "Cottage"] as const;
// prettier-ignore
const LOCATIONS = ["Galle", "Matara", "Unawatuna", "Kandy", "Ella", "Mirissa", "Nuwara Eliya", "Colombo", "Bentota", "Negombo", "Hikkaduwa", "Weligama", "Tangalle", "Trincomalee", "Arugam Bay", "Sigiriya", "Dambulla", "Jaffna", "Kalpitiya", "Haputale", "Habarana", "Pasikuda", "Anuradhapura", "Polonnaruwa", "Tissamaharama", "Ahangama", "Kitulgala", "Mount Lavinia"];
const PLANS: readonly CompanyPlan[] = ["Starter", "Standard", "Pro"];

// Status sets by company index (1 = oldest, 312 = newest). Everything else is active.
const FIXED_RECENT: Record<number, { name: string; location: string; plan: CompanyPlan; status: CompanyAccountStatus; daysAgo: number }> = {
  312: { name: "Sunrise Villa Holdings", location: "Galle", plan: "Standard", status: "active", daysAgo: 0 },
  311: { name: "Lagoon View Villa", location: "Bentota", plan: "Standard", status: "active", daysAgo: 1 },
  310: { name: "Mirissa Bay Rooms", location: "Mirissa", plan: "Starter", status: "pending", daysAgo: 2 },
  309: { name: "Ella Hilltop Cabins", location: "Ella", plan: "Starter", status: "pending", daysAgo: 2.1 },
  308: { name: "Hill Country Lodge", location: "Nuwara Eliya", plan: "Standard", status: "suspended-admin", daysAgo: 4 },
};
const PENDING = new Set(Array.from({ length: 21 }, (_, i) => 267 + i * 2)); // 267, 269 … 307
const SUSPENDED_ADMIN = new Set([296, 240, 198, 150, 97, 44]);
const SUSPENDED_NONPAYMENT = new Set([286, 262, 233, 211, 180, 166, 133, 118, 90, 61, 23]);
// 14 active companies whose subscription is past due, with the days since the
// missed charge. The grace period is 7 days, so the four at day 6 are the
// Overview "4 suspend tomorrow". `server/finance.ts` reads this too.
// prettier-ignore
export const PAST_DUE = new Map<number, number>([[306, 6], [284, 3], [259, 2], [247, 6], [228, 1], [205, 2], [190, 5], [171, 4], [158, 6], [142, 5], [126, 1], [108, 6], [79, 2], [52, 3]]);
// Open website-build requests: when the owner asked and when the team
// promised it (days from now; two are inside the next 48 hours).
const WEBSITE_REQUESTS: Record<number, { daysAgo: number; dueInDays: number; status: WebsiteRequest["status"] }> = {
  311: { daysAgo: 1, dueInDays: 6, status: "requested" },
  306: { daysAgo: 2, dueInDays: 5, status: "requested" },
  304: { daysAgo: 3, dueInDays: 4, status: "requested" },
  302: { daysAgo: 3, dueInDays: 3, status: "in-progress" },
  300: { daysAgo: 4, dueInDays: 2.5, status: "in-progress" },
  298: { daysAgo: 4, dueInDays: 4, status: "requested" },
  294: { daysAgo: 5, dueInDays: 3, status: "in-progress" },
  292: { daysAgo: 6, dueInDays: 1.5, status: "review" },
  290: { daysAgo: 7, dueInDays: 0.5, status: "review" },
};

function statusFor(index: number): CompanyAccountStatus {
  if (FIXED_RECENT[index]) return FIXED_RECENT[index].status;
  if (PENDING.has(index)) return "pending";
  if (SUSPENDED_ADMIN.has(index)) return "suspended-admin";
  if (SUSPENDED_NONPAYMENT.has(index)) return "suspended-nonpayment";
  return "active";
}

function joinedDaysAgo(index: number, rng: () => number) {
  if (FIXED_RECENT[index]) return FIXED_RECENT[index].daysAgo;
  // Oldest company ~2 years ago; newer indices joined more recently.
  return 5 + (TOTAL - index) * 2.3 + rng() * 2;
}

// Fixture-internal view of a company; `server/users.ts` derives staff
// accounts from it. Not part of the API types.
export type GeneratedCompany = CompanyAccount & {
  index: number;
  daysAgo: number;
  slug: string;
  ownerName: string;
  staff: { owners: number; managers: number; frontDesk: number };
};

let cache: { now: number; companies: GeneratedCompany[] } | null = null;

export function allCompanies(now: number): GeneratedCompany[] {
  // Regenerate at most once per day so dates move with the calendar.
  if (cache && dayKey(cache.now) === dayKey(now)) return cache.companies;

  const rng = mulberry32(20261020);
  const combos = PREFIXES.flatMap((prefix) => SUFFIXES.map((suffix) => `${prefix} ${suffix}`));
  for (let i = combos.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [combos[i], combos[j]] = [combos[j], combos[i]];
  }
  const fixedNames = new Set(Object.values(FIXED_RECENT).map((c) => c.name));
  const names = combos.filter((name) => !fixedNames.has(name));

  const list: GeneratedCompany[] = [];
  for (let index = 1; index <= TOTAL; index++) {
    const fixed = FIXED_RECENT[index];
    const name = fixed?.name ?? names[index - 1];
    const r = rng();
    const plan = fixed?.plan ?? (r < 0.35 ? "Starter" : r < 0.8 ? "Standard" : "Pro");
    const p = rng();
    const propertyCount = p < 0.6 ? 1 : p < 0.85 ? 2 : p < 0.95 ? 3 : 4;
    // A company that has not finished setup has only its owner.
    const pending = statusFor(index) === "pending";
    const managers = pending ? 0 : Math.floor(rng() * 3);
    const frontDesk = pending ? 0 : Math.floor(rng() * 4);
    const daysAgo = joinedDaysAgo(index, rng);
    list.push({
      index,
      id: `cmp_${index}`,
      slug: slugify(name),
      name,
      location: fixed?.location ?? pick(rng, LOCATIONS),
      plan,
      propertyCount,
      staff: { owners: 1, managers, frontDesk },
      staffCount: 1 + managers + frontDesk,
      status: statusFor(index),
      joinedAt: dayKey(now - daysAgo * DAY_MS),
      daysAgo,
      ownerName: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`,
    });
  }
  // Pin the platform total to the Overview KPI by adding front-desk staff to
  // the busiest (Pro) companies until it matches.
  let remaining = TOTAL_STAFF - list.reduce((sum, c) => sum + c.staffCount, 0);
  for (let i = list.length - 1; remaining > 0; i = i === 0 ? list.length - 1 : i - 1) {
    const c = list[i];
    if (c.plan !== "Pro" && remaining < 200) continue;
    c.staff.frontDesk += 1;
    c.staffCount += 1;
    remaining -= 1;
  }
  cache = { now, companies: list };
  return list;
}

const strip = (c: GeneratedCompany): CompanyAccount => ({
  id: c.id,
  name: c.name,
  location: c.location,
  plan: c.plan,
  propertyCount: c.propertyCount,
  staffCount: c.staffCount,
  status: c.status,
  joinedAt: c.joinedAt,
});

const PROPERTY_EXTRAS = ["Annex", "Beach Wing", "Garden Rooms"];

// Property names of a company: the company name, then named wings.
export function companyPropertyNames(company: GeneratedCompany) {
  return Array.from({ length: company.propertyCount }, (_, i) => (i === 0 ? company.name : `${company.name} ${PROPERTY_EXTRAS[(i - 1) % PROPERTY_EXTRAS.length]}`));
}

export function isSuspended(status: CompanyAccountStatus) {
  return status === "suspended-admin" || status === "suspended-nonpayment";
}

// --- Public API ---------------------------------------------------------------

export async function getAccountKpis(): Promise<AccountKpi[]> {
  await connection();
  const all = allCompanies(Date.now());
  const count = (...statuses: CompanyAccountStatus[]) => all.filter((c) => statuses.includes(c.status)).length;
  const active = count("active");
  const suspendedAdmin = count("suspended-admin");
  const suspendedNonpayment = count("suspended-nonpayment");
  const requests = await listWebsiteRequests();
  const dueSoon = requests.filter((r) => new Date(r.dueAt).getTime() - Date.now() < 2 * DAY_MS).length;

  return [
    { key: "companies", count: all.length, chip: { label: "+5.6%", tone: "success" }, note: `${active} active · ${count("pending")} pending · ${suspendedAdmin + suspendedNonpayment} suspended` },
    { key: "active", count: active, chip: { label: `${Math.round((active / all.length) * 100)}%`, tone: "success" }, note: `${PAST_DUE.size} subscriptions past due` },
    {
      key: "suspended",
      count: suspendedAdmin + suspendedNonpayment,
      chip: { label: `${suspendedAdmin} by admin`, tone: "danger" },
      note: `${suspendedNonpayment} for non-payment · lifted automatically on payment`,
    },
    { key: "website-requests", count: requests.length, chip: dueSoon > 0 ? { label: `${dueSoon} due in 48h`, tone: "warning" } : null, note: "avg. 3.5 days to go live" },
  ];
}

export async function getCompanyFilterOptions(): Promise<{ regions: string[]; plans: CompanyPlan[] }> {
  await connection();
  const regions = [...new Set(allCompanies(Date.now()).map((c) => c.location))].sort((a, b) => a.localeCompare(b));
  return { regions, plans: [...PLANS] };
}

function periodStart(period: CompanyFilters["period"], now: number) {
  switch (period) {
    case "7d":
      return now - 7 * DAY_MS;
    case "30d":
      return now - 30 * DAY_MS;
    case "month":
      return new Date(`${dayKey(now).slice(0, 7)}-01T00:00:00+05:30`).getTime();
    default:
      return 0;
  }
}

export async function listCompanies(filters: CompanyFilters): Promise<Paged<CompanyAccount>> {
  await connection();
  const now = Date.now();
  const q = filters.q.trim().toLowerCase();
  const since = periodStart(filters.period, now);

  const matches = allCompanies(now).filter((c) => {
    if (filters.status === "suspended" ? !isSuspended(c.status) : filters.status !== "all" && c.status !== filters.status) return false;
    if (filters.plan && c.plan !== filters.plan) return false;
    if (filters.region && c.location !== filters.region) return false;
    if (new Date(`${c.joinedAt}T23:59:59+05:30`).getTime() < since) return false;
    if (q && ![c.name, c.location, c.id].some((v) => v.toLowerCase().includes(q))) return false;
    return true;
  });

  matches.sort((a, b) => {
    if (filters.sort === "name") return a.name.localeCompare(b.name);
    return filters.sort === "newest" ? a.daysAgo - b.daysAgo : b.daysAgo - a.daysAgo;
  });

  const page = Math.min(Math.max(filters.page, 1), Math.max(Math.ceil(matches.length / COMPANY_PAGE_SIZE), 1));
  const start = (page - 1) * COMPANY_PAGE_SIZE;
  return { items: matches.slice(start, start + COMPANY_PAGE_SIZE).map(strip), total: matches.length, page, pageSize: COMPANY_PAGE_SIZE };
}

export async function getCompany(id: string): Promise<CompanyAccountDetail | null> {
  await connection();
  const now = Date.now();
  const company = allCompanies(now).find((c) => c.id === id);
  if (!company) return null;

  const rng = mulberry32(company.index * 7919);
  const request = WEBSITE_REQUESTS[company.index];
  const history = (await listEnforcementLog()).filter((e) => e.companyId === id);

  return {
    ...strip(company),
    legalName: `${company.name} (Pvt) Ltd`,
    registrationNo: `PV ${100000 + ((company.index * 131) % 899999)}`,
    ownerName: company.ownerName,
    contact: `+94 7${company.index % 2 ? "7" : "1"} ${String(100 + company.index).padStart(3, "0")} ${String(4000 + company.index * 53).slice(-4)}`,
    siteHosts: rng() < 0.3 ? [`${company.slug}.sanchara.lk`, `www.${company.slug}.lk`] : [`${company.slug}.sanchara.lk`],
    subscription: subscription(company, now),
    properties: companyPropertyNames(company),
    staff: company.staff,
    websiteRequestId: request ? `web_${company.index}` : null,
    history,
  };
}

function subscription(company: GeneratedCompany, now: number): CompanyAccountDetail["subscription"] {
  const nextMonthEnd = (() => {
    const d = new Date(now);
    d.setUTCMonth(d.getUTCMonth() + 1, 0);
    return d.toISOString().slice(0, 10);
  })();
  switch (company.status) {
    case "pending":
      return { state: "none", detail: `${company.plan} plan selected · starts when the owner completes setup` };
    case "suspended-nonpayment":
      return { state: "suspended", detail: `${company.plan} · unpaid after the 7-day grace period` };
    default:
      if (PAST_DUE.has(company.index)) return { state: "past-due", detail: `${company.plan} · past due ${PAST_DUE.get(company.index)} days · suspends after 7` };
      return { state: "paid", detail: `${company.plan} · paid to ${nextMonthEnd}` };
  }
}

const REASONS = ["Policy violation · misleading photos; repeated after written warning", "Fraud · chargeback pattern across properties", "Legal request · court order received", "Owner request · business closed for the season", "Policy violation · contact details in listing description", "Other · abusive conduct towards platform staff"];
const ADMINS = ["Admin User", "Nimal Perera", "Kamala Silva"];

// Newest first. Suspensions and reactivations of real companies; non-payment
// suspensions are automatic (actor "System").
export async function listEnforcementLog(): Promise<EnforcementEntry[]> {
  await connection();
  const now = Date.now();
  const all = allCompanies(now);
  const rng = mulberry32(42);
  const entries: EnforcementEntry[] = [];
  const at = (daysAgo: number) => new Date(now - daysAgo * DAY_MS - (8 + Math.floor(rng() * 9)) * 3_600_000).toISOString();
  // Nothing can happen to a company before it joined.
  const after = (c: GeneratedCompany, daysAgo: number) => Math.min(daysAgo, Math.max(c.daysAgo - 1, 0.5));

  for (const c of all) {
    if (c.status === "suspended-admin") {
      const reason = pick(rng, REASONS);
      entries.push({ id: `enf_${c.index}_s`, companyId: c.id, companyName: c.name, kind: "suspended", reason, actor: pick(rng, ADMINS), occurredAt: at(after(c, c.index === 308 ? 1 : 2 + rng() * 80)), critical: reason.startsWith("Fraud") || undefined });
    } else if (c.status === "suspended-nonpayment") {
      entries.push({ id: `enf_${c.index}_np`, companyId: c.id, companyName: c.name, kind: "suspended-nonpayment", reason: "Subscription unpaid after the 7-day grace period", actor: "System", occurredAt: at(after(c, 1 + rng() * 60)) });
    }
  }
  // Companies that were suspended earlier and are active again.
  for (const index of [280, 254, 219, 187, 144, 102, 70, 35]) {
    const c = all[index - 1];
    const reactivatedDaysAgo = 3 + rng() * 70;
    const byPayment = rng() < 0.5;
    entries.push(
      byPayment
        ? { id: `enf_${index}_rp`, companyId: c.id, companyName: c.name, kind: "reactivated-payment", reason: "Subscription paid · suspension lifted", actor: "System", occurredAt: at(reactivatedDaysAgo) }
        : { id: `enf_${index}_r`, companyId: c.id, companyName: c.name, kind: "reactivated", reason: "Owner request · issue resolved", actor: pick(rng, ADMINS), occurredAt: at(reactivatedDaysAgo) },
      byPayment
        ? { id: `enf_${index}_np0`, companyId: c.id, companyName: c.name, kind: "suspended-nonpayment", reason: "Subscription unpaid after the 7-day grace period", actor: "System", occurredAt: at(reactivatedDaysAgo + 4 + rng() * 10) }
        : { id: `enf_${index}_s0`, companyId: c.id, companyName: c.name, kind: "suspended", reason: pick(rng, REASONS), actor: pick(rng, ADMINS), occurredAt: at(reactivatedDaysAgo + 6 + rng() * 20) },
    );
  }
  for (const index of [300, 276, 213]) {
    const c = all[index - 1];
    entries.push({ id: `enf_${index}_w`, companyId: c.id, companyName: c.name, kind: "warning", reason: "Policy violation · contact details in listing description", actor: pick(rng, ADMINS), occurredAt: at(2 + rng() * 40) });
  }

  return entries.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

export async function listEnforcementLogPage(page: number, pageSize = COMPANY_PAGE_SIZE): Promise<Paged<EnforcementEntry>> {
  const entries = await listEnforcementLog();
  const safePage = Math.min(Math.max(page, 1), Math.max(Math.ceil(entries.length / pageSize), 1));
  const start = (safePage - 1) * pageSize;
  return { items: entries.slice(start, start + pageSize), total: entries.length, page: safePage, pageSize };
}

// Open website-build requests, soonest due first.
export async function listWebsiteRequests(): Promise<WebsiteRequest[]> {
  await connection();
  const now = Date.now();
  const all = allCompanies(now);
  return Object.entries(WEBSITE_REQUESTS)
    .map(([index, request]) => {
      const c = all[Number(index) - 1];
      return {
        id: `web_${index}`,
        companyId: c.id,
        companyName: c.name,
        location: c.location,
        requestedAt: new Date(now - request.daysAgo * DAY_MS).toISOString(),
        dueAt: new Date(now + request.dueInDays * DAY_MS).toISOString(),
        status: request.status,
      };
    })
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}
