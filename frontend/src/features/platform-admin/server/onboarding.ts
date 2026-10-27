import { adminFetch } from "@/lib/auth/admin";
import type { CompanyPlan, OnboardingItem, OnboardingKpi, Paged } from "../types";
import type { GeneratedCompany } from "./accounts";

// Onboarding & Verification data from the platform-admin API. The fixture
// helpers further down still feed the Audit Logs fixtures.

// GET /v1/admin/onboarding/companies item.
type AwaitingCompany = {
  companyId: string;
  name: string;
  subdomain: string;
  town: string | null;
  district: string | null;
  plan: { code: string; name: string } | null;
  owner: { id: string; fullName: string; email: string } | null;
  createdBy: string | null;
  createdAt: string;
  // expiresAt is null once the link has expired or been used.
  invite: { status: "valid" | "expired"; expiresAt: string | null };
};

// GET /v1/admin/onboarding/summary.
type OnboardingSummary = {
  awaiting: number;
  expired: number;
  createdThisMonth: number;
  createdLastMonth: number;
  setupCompletedThisMonth: number;
};

const toItem = (company: AwaitingCompany): OnboardingItem => ({
  companyId: company.companyId,
  companyName: company.name,
  subdomain: company.subdomain,
  location: company.town ?? company.district ?? "",
  plan: (company.plan?.name ?? "Starter") as CompanyPlan,
  ownerName: company.owner?.fullName ?? "",
  ownerEmail: company.owner?.email ?? "",
  createdBy: company.createdBy ?? "Platform team",
  createdAt: company.createdAt,
  credentialsExpireAt: company.invite.expiresAt,
  status: company.invite.status === "valid" ? "awaiting-sign-in" : "expired",
});

// --- Public API ---------------------------------------------------------------

export async function listAwaitingOwners(page: number): Promise<Paged<OnboardingItem>> {
  const result = await adminFetch<Paged<AwaitingCompany>>(`/v1/admin/onboarding/companies?page=${page}`);
  return { ...result, items: result.items.map(toItem) };
}

export type OnboardingCounts = { awaiting: number; expired: number };

export async function getOnboardingCounts(): Promise<OnboardingCounts> {
  const { awaiting, expired } = await adminFetch<OnboardingSummary>("/v1/admin/onboarding/summary");
  return { awaiting, expired };
}

export async function getOnboardingKpis(): Promise<OnboardingKpi[]> {
  const summary = await adminFetch<OnboardingSummary>("/v1/admin/onboarding/summary");
  return [
    { key: "awaiting", count: summary.awaiting, chip: summary.expired > 0 ? { label: `${summary.expired} expired`, tone: "warning" } : null, note: "Owners who have not signed in yet" },
    { key: "expired", count: summary.expired, chip: null, note: "Links older than 72 hours · generate a new one" },
    { key: "created", count: summary.createdThisMonth, chip: null, note: `${summary.createdLastMonth} last month` },
    { key: "setup", count: summary.setupCompletedThisMonth, chip: null, note: "Owners who accepted their invite" },
  ];
}

// --- Fixture helpers (Audit Logs) ---------------------------------------------

const CREATORS = ["Kamala Silva", "Admin User", "Nimal Perera"];

// Companies are created during office hours (Colombo) on their join day.
// Shared with the Audit Logs fixtures.
export function companyCreatedAt(company: GeneratedCompany) {
  return Date.parse(`${company.joinedAt}T${String(9 + (company.index % 8)).padStart(2, "0")}:${String((company.index * 7) % 60).padStart(2, "0")}:00+05:30`);
}

export function companyCreatedBy(company: GeneratedCompany) {
  return CREATORS[company.index % CREATORS.length];
}
