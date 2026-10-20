import type { ActiveAnnouncement, AdminActivity, OverviewKpi, RecentCompany, WorkQueue } from "../types";

// TEMPORARY fixtures for the Platform Overview. Replace each body with the
// platform-admin API call once it exists; the return types stay the same.
// Nothing here touches bookings, guests, enquiries or payments.

export async function getOverviewKpis(): Promise<OverviewKpi[]> {
  return [
    {
      key: "companies",
      value: { count: 312 },
      deltaRatio: 0.056,
      breakdown: [
        { label: "active", count: 271 },
        { label: "pending", count: 23 },
        { label: "suspended", count: 18 },
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
      value: { count: 1_148 },
      deltaRatio: 0.032,
      breakdown: [
        { label: "owners", count: 312 },
        { label: "managers", count: 398 },
        { label: "front desk", count: 438 },
      ],
    },
    {
      key: "subscriptions",
      value: { money: { amountMinor: 1_842_000_00, currency: "LKR" } },
      deltaRatio: 0.038,
      breakdown: [
        { label: "active", count: 271 },
        { label: "past due", count: 14 },
      ],
    },
  ];
}

export async function getWorkQueues(): Promise<WorkQueue[]> {
  return [
    { key: "applications", count: 23, flag: { label: "6 overdue", tone: "danger" }, note: "avg. 2.3 days" },
    { key: "website-requests", count: 9, flag: { label: "2 due in 48h", tone: "warning" }, note: "avg. 3.5 days" },
    { key: "flagged-content", count: 7, flag: { label: "3 overdue", tone: "danger" }, note: "avg. 1.1 days" },
    { key: "past-due", count: 14, flag: { label: "4 suspend tomorrow", tone: "warning" }, note: "7-day grace" },
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
      kind: "review",
      title: "Review flagged",
      detail: "#RV-2041 – Inappropriate content",
      occurredAt: "2026-10-20T03:11:00Z",
      actor: "Kamala Silva",
    },
    {
      id: "adm_3",
      kind: "role",
      title: "Role permissions changed",
      detail: "Finance Admin · +manage exchange rate",
      occurredAt: "2026-10-20T02:32:00Z",
      actor: "Nimal Perera",
      critical: true,
    },
    {
      id: "adm_2",
      kind: "subscription",
      title: "Company suspended (non-payment)",
      detail: "Hill Country Lodge – Standard plan",
      occurredAt: "2026-10-19T12:52:00Z",
      actor: "System",
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

export async function getActiveAnnouncements(): Promise<ActiveAnnouncement[]> {
  return [
    { id: "ann_4", kind: "feature", title: "New Feature: Website Builder templates", meta: "20 Oct 2026 · Owners · In-app + email" },
    { id: "ann_3", kind: "maintenance", title: "Maintenance: PayHere gateway", meta: "22 Oct, 02:00–04:00 AM (GMT+5:30) · All users" },
    { id: "ann_2", kind: "policy", title: "Policy Update: Content Guidelines", meta: "15 Oct 2026 · Owners & Managers" },
    { id: "ann_1", kind: "reminder", title: "Reminder: Subscription renewals", meta: "Renews 01 Nov 2026 · Owners" },
  ];
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
