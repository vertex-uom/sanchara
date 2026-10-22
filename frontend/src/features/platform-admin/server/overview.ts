import type { AdminActivity, OverviewKpi, RecentCompany, WorkQueue } from "../types";
import { getCompanyStatusCounts } from "./accounts";
import { getSubscriptionCounts } from "./finance";
import { getOnboardingCounts } from "./onboarding";
import { getStaffRoleCounts } from "./users";

// TEMPORARY fixtures for the Platform Overview. Replace each body with the
// platform-admin API call once it exists; the return types stay the same.
// Nothing here touches bookings, guests, enquiries or payments.

export async function getOverviewKpis(): Promise<OverviewKpi[]> {
  // Counts and MRR come from the Accounts, Users and Financial Operations
  // fixtures so every tab agrees.
  const [companies, staff, subscriptions] = await Promise.all([getCompanyStatusCounts(), getStaffRoleCounts(), getSubscriptionCounts()]);
  return [
    {
      key: "companies",
      value: { count: companies.all },
      deltaRatio: 0.056,
      breakdown: [
        { label: "active", count: companies.active },
        { label: "pending", count: companies.pending },
        { label: "suspended", count: companies["suspended-admin"] + companies["suspended-nonpayment"] },
        { label: "closed", count: companies.closed },
      ],
    },
    {
      key: "properties",
      value: { count: 486 },
      deltaRatio: 0.041,
      breakdown: [
        { label: "guest houses", count: 302 },
        { label: "villas", count: 184 },
      ],
    },
    {
      key: "staff",
      value: { count: staff.all },
      deltaRatio: 0.032,
      breakdown: [
        { label: "owners", count: staff.owner },
        { label: "managers", count: staff.manager },
        { label: "front desk", count: staff["front-desk"] },
      ],
    },
    {
      key: "subscriptions",
      value: { money: subscriptions.mrr },
      deltaRatio: 0.038,
      breakdown: [
        { label: "paying", count: subscriptions.paid },
        { label: "unpaid", count: subscriptions.suspended },
      ],
    },
  ];
}

export async function getWorkQueues(): Promise<WorkQueue[]> {
  const onboarding = await getOnboardingCounts();
  return [
    { key: "awaiting-owners", count: onboarding.awaiting, flag: onboarding.expired > 0 ? { label: `${onboarding.expired} expired`, tone: "warning" } : null, note: "resend or regenerate credentials" },
    { key: "website-requests", count: 9, flag: { label: "2 due in 48h", tone: "warning" }, note: "avg. 3.5 days" },
  ];
}

export async function getRecentAdminActivity(limit = 6): Promise<AdminActivity[]> {
  const entries: AdminActivity[] = [
    {
      id: "adm_6",
      kind: "company",
      title: "Company approved",
      detail: "Sunrise Villa Holdings – Galle",
      occurredAt: "2026-10-20T04:54:00Z",
      actor: "Admin User",
    },
    {
      id: "adm_5",
      kind: "exchange-rate",
      title: "Exchange rate updated",
      detail: "USD → LKR 298.40 (was 297.90)",
      occurredAt: "2026-10-20T03:45:00Z",
      actor: "Ruwan Perera",
    },
    {
      id: "adm_4",
      kind: "website",
      title: "Website build started",
      detail: "Heritage template · Tea Hill Resort",
      occurredAt: "2026-10-20T03:11:00Z",
      actor: "Kamala Silva",
    },
    {
      id: "adm_3",
      kind: "role",
      title: "Admin user deactivated",
      detail: "Marcus Hall · marcus.h@sanchara.io",
      occurredAt: "2026-10-20T02:32:00Z",
      actor: "Nimal Perera",
      critical: true,
    },
    {
      id: "adm_2",
      kind: "company",
      title: "Company suspended by administrator",
      detail: "Hill Country Lodge – Nuwara Eliya",
      occurredAt: "2026-10-19T12:52:00Z",
      actor: "Admin User",
    },
    {
      id: "adm_1",
      kind: "website",
      title: "Website built on request",
      detail: "lagoonview.sanchara.lk",
      occurredAt: "2026-10-19T09:48:00Z",
      actor: "Admin User",
    },
  ];
  return entries.slice(0, limit);
}

export async function getRecentCompanies(limit = 5): Promise<RecentCompany[]> {
  const companies: RecentCompany[] = [
    { id: "cmp_312", name: "Sunrise Villa Holdings", location: "Galle", plan: "Standard", status: "active", joinedAt: "2026-10-20" },
    { id: "cmp_311", name: "Lagoon View Villa", location: "Bentota", plan: "Standard", status: "active", joinedAt: "2026-10-19" },
    { id: "cmp_310", name: "Mirissa Bay Rooms", location: "Mirissa", plan: "Starter", status: "pending", joinedAt: "2026-10-18" },
    { id: "cmp_309", name: "Ella Hilltop Cabins", location: "Ella", plan: "Starter", status: "pending", joinedAt: "2026-10-18" },
    { id: "cmp_308", name: "Hill Country Lodge", location: "Nuwara Eliya", plan: "Standard", status: "suspended", joinedAt: "2026-10-16" },
  ];
  return companies.slice(0, limit);
}
