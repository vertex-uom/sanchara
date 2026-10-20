import { connection } from "next/server";
import type { Money } from "@/lib/format/money";
import type { AnalyticsFilters, AnalyticsKpi, AnalyticsPeriod, CompanyPlan, FunnelStep, PlanBreakdown, RetentionCohort, TrendPoint } from "../types";
import { allCompanies, DATA_RETENTION_DAYS, nonpaymentDates, ownerHasSignedIn, type GeneratedCompany } from "./accounts";
import { PLAN_PRICE_MINOR, PLANS } from "./finance";
import { DAY_MS } from "./fixtures";

// TEMPORARY fixtures for Analytics. Everything is derived from the Accounts
// companies (and the plan prices from Finance) so the numbers agree with the
// other tabs; replace each exported function with the platform-admin API
// call once it exists. Only platform-growth data: companies, onboarding,
// subscriptions, retention. Nothing from bookings, guests or payments.

const PERIOD_DAYS: Record<AnalyticsPeriod, number> = { "30d": 30, "90d": 90, "12m": 365 };
const money = (amountMinor: number): Money => ({ amountMinor, currency: "LKR" });

// Fixture-internal: a company's state at an instant in the past.
type StateAt = "none" | "pending" | "active" | "suspended-admin" | "blocked" | "closed";

type Timed = GeneratedCompany & { joinedMs: number; suspendedMs: number | null; closedMs: number | null };

function withTimes(companies: GeneratedCompany[], now: number): Timed[] {
  return companies.map((c) => {
    const dates = nonpaymentDates(c, now);
    const suspendedMs = dates ? Date.parse(`${dates.suspendedAt}T00:00:00Z`) : null;
    return { ...c, joinedMs: now - c.daysAgo * DAY_MS, suspendedMs, closedMs: c.status === "closed" && suspendedMs ? suspendedMs + DATA_RETENTION_DAYS * DAY_MS : null };
  });
}

function stateAt(c: Timed, at: number, now: number): StateAt {
  if (at < c.joinedMs) return "none";
  if (c.closedMs !== null && at >= c.closedMs) return "closed";
  if (c.suspendedMs !== null && at >= c.suspendedMs) return "blocked";
  if (c.status === "pending") return "pending";
  // Administrator suspensions carry no date in the fixtures; count them
  // as suspended for the last month only.
  if (c.status === "suspended-admin") return at >= now - 30 * DAY_MS ? "suspended-admin" : "active";
  return "active";
}

// Active and admin-suspended companies keep paying (as in Finance); pending,
// blocked and closed do not.
const pays = (state: StateAt) => state === "active" || state === "suspended-admin";
const onPlatform = (state: StateAt) => state !== "none" && state !== "closed";

function filtered(now: number, plan: AnalyticsFilters["plan"]) {
  const all = withTimes(allCompanies(now), now);
  return plan ? all.filter((c) => c.plan === plan) : all;
}

const ratio = (current: number, previous: number) => (previous > 0 ? (current - previous) / previous : null);

export async function getAnalyticsKpis(filters: AnalyticsFilters): Promise<AnalyticsKpi[]> {
  await connection();
  const now = Date.now();
  const companies = filtered(now, filters.plan);
  const span = PERIOD_DAYS[filters.period] * DAY_MS;
  const periodStart = now - span;
  const previousStart = now - 2 * span;

  const activeNow = companies.filter((c) => stateAt(c, now, now) === "active").length;
  const activeThen = companies.filter((c) => stateAt(c, periodStart, now) === "active").length;

  const joinedIn = (from: number, to: number) => companies.filter((c) => c.joinedMs >= from && c.joinedMs < to);
  const newNow = joinedIn(periodStart, now);
  const newThen = joinedIn(previousStart, periodStart);
  const stillPending = newNow.filter((c) => c.status === "pending").length;

  const mrrAt = (at: number) => companies.filter((c) => pays(stateAt(c, at, now))).reduce((sum, c) => sum + PLAN_PRICE_MINOR[c.plan], 0);
  const mrrNow = mrrAt(now);
  const mrrThen = mrrAt(periodStart);
  const payingNow = companies.filter((c) => pays(stateAt(c, now, now))).length;

  const blockedIn = (from: number, to: number) => companies.filter((c) => c.suspendedMs !== null && c.suspendedMs >= from && c.suspendedMs < to).length;
  const blockedNow = blockedIn(periodStart, now);
  const blockedThen = blockedIn(previousStart, periodStart);
  const stillBlocked = companies.filter((c) => c.status === "suspended-nonpayment").length;

  return [
    { key: "active", value: { count: activeNow }, deltaRatio: ratio(activeNow, activeThen), note: `${activeThen.toLocaleString("en-US")} at the start of the period` },
    { key: "new", value: { count: newNow.length }, deltaRatio: ratio(newNow.length, newThen.length), note: newNow.length === 0 ? "None joined in this period" : stillPending > 0 ? `${stillPending} still completing setup` : "All have completed setup" },
    { key: "mrr", value: { money: money(mrrNow) }, deltaRatio: ratio(mrrNow, mrrThen), note: `${payingNow.toLocaleString("en-US")} paying companies` },
    { key: "blocked", value: { count: blockedNow }, deltaRatio: ratio(blockedNow, blockedThen), note: `${stillBlocked} currently blocked · data kept one year` },
  ];
}

const MONTH_LABEL = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });
const MONTH_LONG = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

// End of the month `offset` months before the current one (0 = now).
function monthEnd(now: number, offset: number) {
  const d = new Date(now);
  if (offset === 0) return now;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - offset + 1, 0, 23, 59, 59);
}

function monthKey(ms: number) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Twelve monthly points ending today: companies on the platform and MRR.
export async function getTrend(filters: AnalyticsFilters): Promise<TrendPoint[]> {
  await connection();
  const now = Date.now();
  const companies = filtered(now, filters.plan);
  return Array.from({ length: 12 }, (_, i) => {
    const at = monthEnd(now, 11 - i);
    const states = companies.map((c) => stateAt(c, at, now));
    return {
      month: monthKey(at),
      label: MONTH_LABEL.format(new Date(at)),
      companies: states.filter(onPlatform).length,
      mrr: money(companies.reduce((sum, c, idx) => sum + (pays(states[idx]) ? PLAN_PRICE_MINOR[c.plan] : 0), 0)),
    };
  });
}

const FIRST_RENEWAL_DAYS = 35;

// Companies created in the period: did the Owner sign in, finish setup and
// pay the first renewal?
export async function getOnboardingFunnel(filters: AnalyticsFilters): Promise<FunnelStep[]> {
  await connection();
  const now = Date.now();
  const periodStart = now - PERIOD_DAYS[filters.period] * DAY_MS;
  const created = filtered(now, filters.plan).filter((c) => c.joinedMs >= periodStart);
  const signedIn = created.filter(ownerHasSignedIn);
  const setup = created.filter((c) => c.status !== "pending");
  // Paid the first renewal: set up, and not blocked within the first month.
  const paid = setup.filter((c) => c.suspendedMs === null || c.suspendedMs > c.joinedMs + FIRST_RENEWAL_DAYS * DAY_MS);
  const counts: [FunnelStep["key"], string, number][] = [
    ["created", "Companies created", created.length],
    ["signed-in", "Owner signed in", signedIn.length],
    ["setup", "Setup completed", setup.length],
    ["paid", "First renewal paid", paid.length],
  ];
  return counts.map(([key, label, count], i) => ({ key, label, count, rate: i === 0 ? null : counts[i - 1][2] > 0 ? count / counts[i - 1][2] : 0 }));
}

export async function getPlanBreakdown(): Promise<PlanBreakdown[]> {
  await connection();
  const now = Date.now();
  const companies = withTimes(allCompanies(now), now).filter((c) => c.status !== "closed");
  const rows = PLANS.map((plan: CompanyPlan) => {
    const mine = companies.filter((c) => c.plan === plan);
    const paying = mine.filter((c) => pays(stateAt(c, now, now)));
    const withData = mine.filter((c) => c.status !== "pending");
    const avg = (pickValue: (c: Timed) => number) => (withData.length ? withData.reduce((sum, c) => sum + pickValue(c), 0) / withData.length : 0);
    return { plan, companies: mine.length, mrrMinor: paying.length * PLAN_PRICE_MINOR[plan], avgProperties: avg((c) => c.propertyCount), avgStaff: avg((c) => c.staffCount) };
  });
  const total = rows.reduce((sum, r) => sum + r.mrrMinor, 0);
  return rows.map(({ mrrMinor, ...row }) => ({ ...row, mrr: money(mrrMinor), share: total ? mrrMinor / total : 0 }));
}

const COHORT_MONTHS = 6;

// For each of the last six signup months: the share of that month's companies
// (those that completed setup) still paying at the end of M0, M1, … (null
// once a month is in the future).
export async function getRetentionCohorts(filters: AnalyticsFilters): Promise<RetentionCohort[]> {
  await connection();
  const now = Date.now();
  const companies = filtered(now, filters.plan);
  return Array.from({ length: COHORT_MONTHS }, (_, i) => {
    const offset = COHORT_MONTHS - 1 - i;
    const end = monthEnd(now, offset);
    const start = monthEnd(now, offset + 1);
    const cohort = companies.filter((c) => c.status !== "pending" && c.joinedMs > start && c.joinedMs <= end);
    const retention = Array.from({ length: COHORT_MONTHS }, (_, k) => {
      if (k > offset || cohort.length === 0) return null;
      const at = monthEnd(now, offset - k);
      return cohort.filter((c) => pays(stateAt(c, at, now))).length / cohort.length;
    });
    return { month: monthKey(end), label: MONTH_LONG.format(new Date(end)), size: cohort.length, retention };
  });
}
