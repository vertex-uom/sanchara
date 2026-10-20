import { connection } from "next/server";
import { OWNER_CREDENTIALS_VALID_HOURS, type OnboardingItem, type OnboardingKpi, type Paged } from "../types";
import { allCompanies, ownerHasSignedIn, type GeneratedCompany } from "./accounts";
import { dayKey } from "./fixtures";

// TEMPORARY fixtures for Onboarding & Verification. The list is derived from
// the Accounts companies (pending ones whose Owner has not signed in yet) so
// it agrees with the other tabs. Replace each exported function with the
// platform-admin API call once it exists. Creating a company happens in the
// browser for now (see onboarding/credentials.ts); the API will own it.

export const ONBOARDING_PAGE_SIZE = 10;

const HOUR_MS = 60 * 60 * 1000;

export const PROPERTY_TYPES = ["Guest House", "Villa", "Homestay", "Boutique Hotel", "Resort", "Cottage", "Hostel", "Apartment"] as const;

const CREATORS = ["Kamala Silva", "Admin User", "Nimal Perera"];

// Companies whose credentials were re-issued recently, so the list shows
// both valid and expired links: index → hours ago.
const REGENERATED: Record<number, number> = { 307: 9, 305: 30, 301: 60, 295: 4 };

function ownerEmail(company: GeneratedCompany) {
  const [first, last] = company.ownerName.toLowerCase().split(" ");
  return `${first}.${last}@${company.slug.replace(/-/g, "")}.lk`;
}

// Companies are created during office hours (Colombo) on their join day.
// Shared with the Audit Logs fixtures.
export function companyCreatedAt(company: GeneratedCompany) {
  return Date.parse(`${company.joinedAt}T${String(9 + (company.index % 8)).padStart(2, "0")}:${String((company.index * 7) % 60).padStart(2, "0")}:00+05:30`);
}

export function companyCreatedBy(company: GeneratedCompany) {
  return CREATORS[company.index % CREATORS.length];
}

function toItem(company: GeneratedCompany, now: number): OnboardingItem {
  const createdAt = companyCreatedAt(company);
  const regeneratedHoursAgo = REGENERATED[company.index];
  const issuedAt = regeneratedHoursAgo === undefined ? createdAt : now - regeneratedHoursAgo * HOUR_MS;
  const expiresAt = issuedAt + OWNER_CREDENTIALS_VALID_HOURS * HOUR_MS;
  return {
    companyId: company.id,
    companyName: company.name,
    subdomain: company.slug,
    location: company.location,
    plan: company.plan,
    ownerName: company.ownerName,
    ownerEmail: ownerEmail(company),
    createdBy: companyCreatedBy(company),
    createdAt: new Date(createdAt).toISOString(),
    credentialsIssuedAt: new Date(issuedAt).toISOString(),
    credentialsExpireAt: new Date(expiresAt).toISOString(),
    status: expiresAt > now ? "awaiting-sign-in" : "expired",
  };
}

// Newest first.
function awaiting(now: number): OnboardingItem[] {
  return allCompanies(now)
    .filter((c) => c.status === "pending" && !ownerHasSignedIn(c))
    .map((c) => toItem(c, now))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// --- Public API ---------------------------------------------------------------

export async function listAwaitingOwners(page: number): Promise<Paged<OnboardingItem>> {
  await connection();
  const items = awaiting(Date.now());
  const safePage = Math.min(Math.max(page, 1), Math.max(Math.ceil(items.length / ONBOARDING_PAGE_SIZE), 1));
  const start = (safePage - 1) * ONBOARDING_PAGE_SIZE;
  return { items: items.slice(start, start + ONBOARDING_PAGE_SIZE), total: items.length, page: safePage, pageSize: ONBOARDING_PAGE_SIZE };
}

export type OnboardingCounts = { awaiting: number; expired: number };

export async function getOnboardingCounts(): Promise<OnboardingCounts> {
  await connection();
  const items = awaiting(Date.now());
  return { awaiting: items.length, expired: items.filter((i) => i.status === "expired").length };
}

export async function getOnboardingKpis(): Promise<OnboardingKpi[]> {
  await connection();
  const now = Date.now();
  const items = awaiting(now);
  const expired = items.filter((i) => i.status === "expired").length;
  const companies = allCompanies(now);
  const monthKey = dayKey(now).slice(0, 7);
  const previousMonth = new Date(now);
  previousMonth.setUTCMonth(previousMonth.getUTCMonth() - 1);
  const previousKey = dayKey(previousMonth.getTime()).slice(0, 7);
  const createdThisMonth = companies.filter((c) => c.joinedAt.startsWith(monthKey)).length;
  const createdLastMonth = companies.filter((c) => c.joinedAt.startsWith(previousKey)).length;
  const completedThisMonth = companies.filter((c) => c.joinedAt.startsWith(monthKey) && c.status !== "pending").length;
  const completingSetup = companies.filter((c) => c.status === "pending" && ownerHasSignedIn(c)).length;

  return [
    { key: "awaiting", count: items.length, chip: expired > 0 ? { label: `${expired} expired`, tone: "warning" } : null, note: "Owners who have not signed in yet" },
    { key: "expired", count: expired, chip: null, note: "Links older than 72 hours · regenerate to resend" },
    { key: "created", count: createdThisMonth, chip: null, note: `${createdLastMonth} last month` },
    { key: "setup", count: completedThisMonth, chip: null, note: `${completingSetup} owners signed in and completing setup` },
  ];
}
