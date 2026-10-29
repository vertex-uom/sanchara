import "server-only";
import { ApiError } from "@/lib/api-client/server";
import { adminFetch } from "@/lib/auth/admin";
import { colomboDateKey, formatDateOnly } from "@/lib/format/dates";
import type { AccountKpi, CompanyAccount, CompanyAccountDetail, CompanyAccountStatus, CompanyFilters, EnforcementEntry, Paged } from "../types";
import { countOpenWebsiteRequests } from "./website-requests";

// Accounts & Enforcement from the API (/v1/admin/companies, /v1/admin/enforcement).

type ApiStatus = "active" | "pending-setup" | "suspended-by-admin" | "suspended-non-payment";

type ApiCompanyRow = {
  id: string;
  name: string;
  subdomain: string;
  location: string;
  plan: { code: string; name: string } | null;
  propertyCount: number;
  staffCount: number;
  status: ApiStatus;
  joinedAt: string;
};

type ApiCompanyDetail = ApiCompanyRow & {
  legalName: string | null;
  registrationNo: string | null;
  owner: { name: string; email: string; phone: string | null; status: string } | null;
  subscription: { status: string; planName: string; startedAt: string } | null;
  properties: { id: string; name: string; city: string; status: string }[];
  staff: { owners: number; managers: number; frontDesk: number };
  siteHosts: string[];
  websiteRequestId: string | null;
  history: EnforcementEntry[];
};

const STATUSES: Record<ApiStatus, CompanyAccountStatus> = {
  active: "active",
  "pending-setup": "pending",
  "suspended-by-admin": "suspended-admin",
  "suspended-non-payment": "suspended-nonpayment",
};

const STATUS_FILTERS: Partial<Record<CompanyFilters["status"], string>> = {
  active: "active",
  pending: "pending-setup",
  suspended: "suspended",
  "suspended-admin": "suspended-by-admin",
  "suspended-nonpayment": "suspended-non-payment",
};

function joinedAfter(period: CompanyFilters["period"]): string | null {
  const now = Date.now();
  if (period === "7d") return new Date(now - 7 * 864e5).toISOString();
  if (period === "30d") return new Date(now - 30 * 864e5).toISOString();
  if (period === "month") {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit" }).format(now);
    return new Date(`${today}-01T00:00:00+05:30`).toISOString();
  }
  return null;
}

function toAccount(row: ApiCompanyRow): CompanyAccount {
  return {
    id: row.id,
    name: row.name,
    location: row.location || "—",
    plan: row.plan?.name ?? "No plan",
    propertyCount: row.propertyCount,
    staffCount: row.staffCount,
    status: STATUSES[row.status],
    // "2026-10-30": the Colombo date the company joined.
    joinedAt: colomboDateKey(new Date(row.joinedAt)),
  };
}

function subscriptionOf(company: ApiCompanyDetail): CompanyAccountDetail["subscription"] {
  const plan = company.subscription?.planName ?? company.plan?.name;
  if (!company.subscription) return { state: "none", detail: "No plan chosen yet" };
  if (company.status === "pending-setup") return { state: "none", detail: `${plan} plan selected · starts when the Owner completes setup` };
  if (company.status === "suspended-non-payment") return { state: "suspended", detail: `${plan} · renewal not paid` };
  if (company.subscription.status === "active") return { state: "paid", detail: `${plan} · active since ${formatDateOnly(colomboDateKey(new Date(company.subscription.startedAt)))}` };
  return { state: "none", detail: `${plan} · ${company.subscription.status}` };
}

export async function listCompanies(filters: CompanyFilters): Promise<Paged<CompanyAccount>> {
  const query = new URLSearchParams();
  if (filters.q.trim()) query.set("q", filters.q.trim());
  const status = STATUS_FILTERS[filters.status];
  if (status) query.set("status", status);
  if (filters.plan) query.set("plan", filters.plan);
  if (filters.region) query.set("town", filters.region);
  const after = joinedAfter(filters.period);
  if (after) query.set("joinedAfter", after);
  if (filters.sort !== "newest") query.set("sort", filters.sort);
  if (filters.page > 1) query.set("page", String(filters.page));
  const result = await adminFetch<Paged<ApiCompanyRow>>(`/v1/admin/companies${query.size ? `?${query}` : ""}`);
  return { ...result, items: result.items.map(toAccount) };
}

// Towns (the Region filter) and plans.
export async function getCompanyFilterOptions(): Promise<{ regions: string[]; plans: { code: string; name: string }[] }> {
  const { towns, plans } = await adminFetch<{ towns: string[]; plans: { code: string; name: string }[] }>("/v1/admin/companies/options");
  return { regions: towns, plans };
}

// Null when the id isn't a company.
export async function getCompany(id: string): Promise<CompanyAccountDetail | null> {
  let company: ApiCompanyDetail;
  try {
    company = (await adminFetch<{ company: ApiCompanyDetail }>(`/v1/admin/companies/${encodeURIComponent(id)}`)).company;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
  return {
    ...toAccount(company),
    legalName: company.legalName ?? "—",
    registrationNo: company.registrationNo ?? "—",
    ownerName: company.owner ? `${company.owner.name}${company.owner.status === "invited" ? " (invited)" : ""}` : "—",
    contact: company.owner ? [company.owner.email, company.owner.phone].filter(Boolean).join(" · ") : "—",
    siteHosts: company.siteHosts,
    subscription: subscriptionOf(company),
    properties: company.properties.map((property) => property.name),
    staff: company.staff,
    websiteRequestId: company.websiteRequestId,
    history: company.history,
  };
}

export async function listEnforcementLogPage(page: number): Promise<Paged<EnforcementEntry>> {
  return adminFetch<Paged<EnforcementEntry>>(`/v1/admin/enforcement${page > 1 ? `?page=${page}` : ""}`);
}

export async function countEnforcementEntries(): Promise<number> {
  return (await listEnforcementLogPage(1)).total;
}

export async function getAccountKpis(): Promise<AccountKpi[]> {
  const [summary, requests] = await Promise.all([
    adminFetch<{ total: number; active: number; pendingSetup: number; suspendedByAdmin: number; suspendedNonPayment: number; joinedLast30Days: number }>(
      "/v1/admin/companies/summary",
    ),
    countOpenWebsiteRequests(),
  ]);
  const suspended = summary.suspendedByAdmin + summary.suspendedNonPayment;
  const activeShare = summary.total ? Math.round((summary.active / summary.total) * 100) : 0;
  return [
    { key: "companies", count: summary.total, chip: null, note: `${summary.active} active · ${summary.pendingSetup} pending · ${suspended} suspended` },
    { key: "active", count: summary.active, chip: { label: `${activeShare}%`, tone: "success" }, note: `${summary.joinedLast30Days} joined in the last 30 days` },
    {
      key: "suspended",
      count: suspended,
      chip: summary.suspendedByAdmin ? { label: `${summary.suspendedByAdmin} by admin`, tone: "danger" } : null,
      note: `${summary.suspendedNonPayment} for non-payment · access restored on payment`,
    },
    { key: "website-requests", count: requests.total, chip: requests.dueSoon > 0 ? { label: `${requests.dueSoon} due in 48h`, tone: "warning" } : null, note: "Sent from the Back Office" },
  ];
}
