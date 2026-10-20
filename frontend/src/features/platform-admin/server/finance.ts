import { connection } from "next/server";
import type { Money } from "@/lib/format/money";
import type {
  CompanyPlan,
  CompanySubscription,
  CompanySubscriptionDetail,
  ExchangeRate,
  Paged,
  SubscriptionFilters,
  SubscriptionInvoice,
  SubscriptionStatus,
} from "../types";
import { allCompanies, listEnforcementLog, PAST_DUE, type GeneratedCompany } from "./accounts";
import { DAY_MS, dayKey, mulberry32, pick } from "./fixtures";

// TEMPORARY fixtures for Financial Operations. Replace each exported function
// with the platform-admin API call once it exists; the return types stay the
// same. Subscriptions are derived from the Accounts companies so plan,
// status, past-due and suspension counts agree with Accounts and Overview.
// Nothing here touches guest payments, refunds or reservations.

export const SUBSCRIPTION_PAGE_SIZE = 8;
const GRACE_DAYS = 7;
const CURRENCY = "LKR";

// Monthly plan prices (minor units). The real list is still open per the
// architecture docs ("Plan prices and limits").
const PLAN_PRICE_MINOR: Record<CompanyPlan, number> = {
  Starter: 3_900_00,
  Standard: 6_900_00,
  Pro: 10_900_00,
};

export const PLANS: readonly CompanyPlan[] = ["Starter", "Standard", "Pro"];

const money = (amountMinor: number): Money => ({ amountMinor, currency: CURRENCY });

// --- Date helpers (date-only strings, no time zone shift) --------------------

function toDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`);
}

function addDays(isoDate: string, days: number) {
  return new Date(toDate(isoDate).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

function addMonths(isoDate: string, months: number) {
  const d = toDate(isoDate);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  d.setUTCDate(day);
  return d.toISOString().slice(0, 10);
}

function dayOfMonth(isoDate: string) {
  return Number(isoDate.slice(8, 10));
}

// Next charge for a paid subscription: the billing day this month if still
// ahead, otherwise next month.
function nextCharge(today: string, billingDay: number) {
  const thisMonth = `${today.slice(0, 8)}${String(billingDay).padStart(2, "0")}`;
  return thisMonth > today ? thisMonth : addMonths(thisMonth, 1);
}

// --- Generation ---------------------------------------------------------------

type Generated = CompanySubscription & { index: number; companyStatus: GeneratedCompany["status"]; startedAt: string | null; billingDay: number | null; suspendedAt: string | null };

function statusFor(c: GeneratedCompany): SubscriptionStatus {
  if (c.status === "pending") return "not-started";
  if (c.status === "suspended-nonpayment") return "suspended";
  if (PAST_DUE.has(c.index)) return "past-due";
  return "paid";
}

let cache: { now: number; items: Generated[] } | null = null;

async function allSubscriptions(now: number): Promise<Generated[]> {
  if (cache && dayKey(cache.now) === dayKey(now)) return cache.items;

  const today = dayKey(now);
  const suspendedAt = new Map<string, string>();
  for (const entry of await listEnforcementLog()) {
    // The current suspension of a company suspended for non-payment.
    if (entry.kind === "suspended-nonpayment" && entry.id.endsWith("_np")) suspendedAt.set(entry.companyId, entry.occurredAt.slice(0, 10));
  }

  const items = allCompanies(now).map((c): Generated => {
    const status = statusFor(c);
    const base = { id: c.id, index: c.index, companyName: c.name, location: c.location, plan: c.plan, price: money(PLAN_PRICE_MINOR[c.plan]), companyStatus: c.status, startedAt: c.joinedAt };
    switch (status) {
      case "not-started":
        return { ...base, status, startedAt: null, billingDay: null, dueAt: null, graceEndsAt: null, suspendedAt: null };
      case "past-due": {
        const dueAt = addDays(today, -(PAST_DUE.get(c.index) ?? 1));
        return { ...base, status, billingDay: dayOfMonth(dueAt), dueAt, graceEndsAt: addDays(dueAt, GRACE_DAYS), suspendedAt: null };
      }
      case "suspended": {
        const since = suspendedAt.get(c.id) ?? addDays(today, -10);
        const dueAt = addDays(since, -GRACE_DAYS);
        return { ...base, status, billingDay: dayOfMonth(dueAt), dueAt, graceEndsAt: null, suspendedAt: since };
      }
      default: {
        const billingDay = Math.min(dayOfMonth(c.joinedAt), 28);
        return { ...base, status, billingDay, dueAt: nextCharge(today, billingDay), graceEndsAt: null, suspendedAt: null };
      }
    }
  });
  cache = { now, items };
  return items;
}

const strip = (s: Generated): CompanySubscription => ({
  id: s.id,
  companyName: s.companyName,
  location: s.location,
  plan: s.plan,
  price: s.price,
  status: s.status,
  dueAt: s.dueAt,
  graceEndsAt: s.graceEndsAt,
});

// --- Public API ---------------------------------------------------------------

export type SubscriptionCounts = Record<SubscriptionStatus, number> & { all: number; mrr: Money };

export async function getSubscriptionCounts(): Promise<SubscriptionCounts> {
  await connection();
  const all = await allSubscriptions(Date.now());
  const count = (status: SubscriptionStatus) => all.filter((s) => s.status === status).length;
  // MRR counts every subscription that is billed, including those past due.
  const mrr = all.filter((s) => s.status === "paid" || s.status === "past-due").reduce((sum, s) => sum + s.price.amountMinor, 0);
  return { all: all.length, paid: count("paid"), "past-due": count("past-due"), suspended: count("suspended"), "not-started": count("not-started"), mrr: money(mrr) };
}

const STATUS_RANK: Record<SubscriptionStatus, number> = { "past-due": 0, paid: 1, suspended: 2, "not-started": 3 };

export async function listSubscriptions(filters: SubscriptionFilters): Promise<Paged<CompanySubscription>> {
  await connection();
  const now = Date.now();
  const today = dayKey(now);
  const q = filters.q.trim().toLowerCase();
  const horizon = filters.due === "7d" ? addDays(today, 7) : filters.due === "30d" ? addDays(today, 30) : null;

  const matches = (await allSubscriptions(now)).filter((s) => {
    if (filters.status !== "all" && s.status !== filters.status) return false;
    if (filters.plan && s.plan !== filters.plan) return false;
    if (filters.due === "overdue" && s.status !== "past-due") return false;
    if (horizon && !(s.status === "paid" && s.dueAt !== null && s.dueAt <= horizon)) return false;
    if (q && ![s.companyName, s.location, s.id].some((v) => v.toLowerCase().includes(q))) return false;
    return true;
  });

  matches.sort((a, b) => {
    if (filters.sort === "name") return a.companyName.localeCompare(b.companyName);
    if (filters.sort === "amount") return b.price.amountMinor - a.price.amountMinor || a.companyName.localeCompare(b.companyName);
    // Most urgent first: overdue (oldest missed charge first), then upcoming
    // charges, then suspended (most recent first), then not started.
    if (a.status !== b.status) return STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (a.status === "suspended") return (b.dueAt ?? "").localeCompare(a.dueAt ?? "");
    return (a.dueAt ?? "").localeCompare(b.dueAt ?? "") || a.companyName.localeCompare(b.companyName);
  });

  const page = Math.min(Math.max(filters.page, 1), Math.max(Math.ceil(matches.length / SUBSCRIPTION_PAGE_SIZE), 1));
  const start = (page - 1) * SUBSCRIPTION_PAGE_SIZE;
  return { items: matches.slice(start, start + SUBSCRIPTION_PAGE_SIZE).map(strip), total: matches.length, page, pageSize: SUBSCRIPTION_PAGE_SIZE };
}

export async function getSubscription(id: string): Promise<CompanySubscriptionDetail | null> {
  await connection();
  const now = Date.now();
  const s = (await allSubscriptions(now)).find((item) => item.id === id);
  if (!s) return null;
  return {
    ...strip(s),
    companyStatus: s.companyStatus,
    startedAt: s.startedAt,
    billingDay: s.billingDay,
    suspendedAt: s.suspendedAt,
    invoices: invoicesFor(s, dayKey(now)),
  };
}

// Up to six monthly invoices, newest first. The newest one is the charge the
// status refers to: open while past due, failed once suspended.
function invoicesFor(s: Generated, today: string): SubscriptionInvoice[] {
  if (s.status === "not-started" || !s.dueAt || !s.startedAt) return [];
  const rng = mulberry32(s.index * 104_729);
  // Newest charge date: for a paid subscription the last one, not the next.
  const latest = s.status === "paid" ? addMonths(s.dueAt, -1) : s.dueAt;
  const invoices: SubscriptionInvoice[] = [];
  for (let i = 0; i < 6; i++) {
    const periodStart = addMonths(latest, -i);
    if (periodStart < s.startedAt) break;
    const paid = i > 0 || s.status === "paid";
    const issuedAt = `${periodStart}T03:${String(10 + Math.floor(rng() * 40)).padStart(2, "0")}:00Z`;
    invoices.push({
      id: `inv_${s.index}_${i}`,
      number: `INV-${periodStart.slice(0, 7).replace("-", "")}-${String(s.index).padStart(4, "0")}`,
      periodStart,
      periodEnd: addDays(addMonths(periodStart, 1), -1),
      amount: s.price,
      status: paid ? "paid" : s.status === "suspended" ? "failed" : "open",
      issuedAt,
      paidAt: paid ? new Date(new Date(issuedAt).getTime() + Math.floor(rng() * 36) * 3_600_000).toISOString() : null,
    });
  }
  // A company that started billing this month has nothing yet.
  return invoices.filter((inv) => inv.periodStart <= today);
}

// --- Exchange rate ------------------------------------------------------------

const RATE_SETTERS = ["Ruwan Perera", "Admin User", "Nimal Perera"];
const RATE_NOTES = ["CBSL indicative rate", "Weekly review", null, null, "Adjusted after bank quote", null];
// Days before the latest update; the latest matches the Overview activity
// entry ("USD → LKR 298.40 (was 297.90)" by Ruwan Perera at 09:15).
const RATE_HISTORY_DAYS = [0, 4, 7, 11, 14, 18, 21, 25, 28, 32, 35, 42];

export async function listExchangeRateHistory(): Promise<ExchangeRate[]> {
  await connection();
  const now = Date.now();
  const todayAt0915 = new Date(`${dayKey(now)}T03:45:00Z`).getTime();
  const latestAt = Math.min(todayAt0915, now - 15 * 60_000);
  const rng = mulberry32(2984);

  const rates: number[] = [298.4, 297.9];
  while (rates.length < RATE_HISTORY_DAYS.length + 1) {
    const last = rates[rates.length - 1];
    rates.push(Math.round((last + (rng() - 0.55) * 1.2) * 100) / 100);
  }

  return RATE_HISTORY_DAYS.map((daysAgo, i) => ({
    id: `fx_${RATE_HISTORY_DAYS.length - i}`,
    usdToLkr: rates[i],
    previous: rates[i + 1] ?? null,
    setAt: new Date(latestAt - daysAgo * DAY_MS + (i === 0 ? 0 : Math.floor((rng() - 0.5) * 4) * 3_600_000)).toISOString(),
    setBy: i === 0 ? RATE_SETTERS[0] : pick(rng, RATE_SETTERS),
    note: i === 0 ? "CBSL indicative rate" : pick(rng, RATE_NOTES),
  }));
}

export async function getExchangeRate(): Promise<ExchangeRate> {
  const [current] = await listExchangeRateHistory();
  return current;
}
