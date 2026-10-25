import { adminFetch } from "@/lib/auth/admin";
import type { AdminActivity, OverviewKpi, RecentCompany, WorkQueue } from "../types";
import { getSubscriptionCounts } from "./finance";
import { getOnboardingCounts } from "./onboarding";

// Platform Overview. The companies, properties and staff counts come from the
// API; the "vs last month" deltas, the MRR card and the other sections are still
// fixtures. Nothing here touches bookings, guests, enquiries or payments.

// GET /v1/admin/overview/summary.
type OverviewSummary = {
  companies: { total: number; byStatus: { active: number; pendingSetup: number; suspendedNonPayment: number; suspendedByAdmin: number } };
  properties: { total: number; byType: { code: string; name: string; count: number }[] };
  staffUsers: { total: number; byRole: { owner: number; manager: number; frontDesk: number } };
};

// 1 → "guest house", 2 → "guest houses".
const noun = (count: number, singular: string) => (count === 1 ? singular : `${singular}s`);

export async function getOverviewKpis(): Promise<OverviewKpi[]> {
  const [{ companies, properties, staffUsers }, subscriptions] = await Promise.all([adminFetch<OverviewSummary>("/v1/admin/overview/summary"), getSubscriptionCounts()]);
  return [
    {
      key: "companies",
      value: { count: companies.total },
      // TODO(overview): sample delta until monthly history is tracked.
      deltaRatio: 0.056,
      breakdown: [
        { label: "active", count: companies.byStatus.active },
        { label: "pending", count: companies.byStatus.pendingSetup },
        { label: "suspended", count: companies.byStatus.suspendedNonPayment + companies.byStatus.suspendedByAdmin },
      ],
    },
    {
      key: "properties",
      value: { count: properties.total },
      deltaRatio: 0.041,
      // The three largest types.
      breakdown: properties.byType.slice(0, 3).map((type) => ({ label: noun(type.count, type.name.toLowerCase()), count: type.count })),
    },
    {
      key: "staff",
      value: { count: staffUsers.total },
      deltaRatio: 0.032,
      breakdown: [
        { label: noun(staffUsers.byRole.owner, "owner"), count: staffUsers.byRole.owner },
        { label: noun(staffUsers.byRole.manager, "manager"), count: staffUsers.byRole.manager },
        { label: "front desk", count: staffUsers.byRole.frontDesk },
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
