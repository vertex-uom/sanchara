import { connection } from "next/server";
import type { CompanyPlan, CustomDomain, CustomDomainStatus, DomainSettings, Paged, PlanDefinition, WebsiteTemplate } from "../types";
import { allCompanies, PLATFORM_DOMAIN, type GeneratedCompany } from "./accounts";
import { PLAN_PRICE_MINOR } from "./finance";
import { DAY_MS, mulberry32 } from "./fixtures";

// TEMPORARY fixtures for Platform Configuration. Replace each exported
// function with the platform-admin API call once it exists; the return types
// stay the same. Plans come from `subscriptions`, hosts from `domains`,
// templates from `website`. Prices, limits and reports per plan are open in
// the architecture docs; these values are placeholders the UI renders, never
// rules the apps enforce.

export const CUSTOM_DOMAIN_PAGE_SIZE = 8;

// --- Plans ----------------------------------------------------------------------

const PLAN_META: Record<CompanyPlan, Omit<PlanDefinition, "id" | "name" | "monthlyPrice" | "companies">> = {
  Starter: {
    tagline: "One guest house or villa, run by a small team.",
    limits: { properties: 1, units: 10, staffAccounts: 3 },
    reports: ["Occupancy", "Arrivals & departures"],
  },
  Standard: {
    tagline: "A few properties with managers and front desk.",
    limits: { properties: 3, units: 40, staffAccounts: 10 },
    reports: ["Occupancy", "Arrivals & departures", "Revenue by rate plan", "Taxes collected"],
  },
  Pro: {
    tagline: "Multi-property operators who need everything.",
    limits: { properties: 10, units: 200, staffAccounts: null },
    reports: ["Occupancy", "Arrivals & departures", "Revenue by rate plan", "Taxes collected", "Payments & refunds", "Audit trail export"],
  },
};

export async function getPlans(): Promise<PlanDefinition[]> {
  await connection();
  const companies = allCompanies(Date.now()).filter((c) => c.status !== "closed");
  return (Object.keys(PLAN_META) as CompanyPlan[]).map((plan) => ({
    id: plan,
    name: plan,
    ...PLAN_META[plan],
    monthlyPrice: { amountMinor: PLAN_PRICE_MINOR[plan], currency: "LKR" },
    companies: companies.filter((c) => c.plan === plan).length,
  }));
}

// --- Domains ---------------------------------------------------------------------

// In the apps these come from PLATFORM_DOMAIN / BACKOFFICE_HOST / ADMIN_HOST;
// here they are the production values the platform team would see.
const DOMAIN_SETTINGS: DomainSettings = {
  platformDomain: PLATFORM_DOMAIN,
  centralHost: `www.${PLATFORM_DOMAIN}`,
  backOfficeHost: `backoffice.${PLATFORM_DOMAIN}`,
  adminHost: `admin.${PLATFORM_DOMAIN}`,
  reserved: [
    { name: "www", purpose: "Central site and guest accounts" },
    { name: "backoffice", purpose: "Back Office for company staff" },
    { name: "admin", purpose: "This console" },
    { name: "api", purpose: "Public API" },
    { name: "assets", purpose: "Images and uploads" },
    { name: "status", purpose: "Status page" },
    { name: "help", purpose: "Help centre" },
    { name: "mail", purpose: "Transactional email" },
  ],
  checkIntervalMinutes: 15,
};

export async function getDomainSettings(): Promise<DomainSettings> {
  await connection();
  return DOMAIN_SETTINGS;
}

// Same roll as `getCompany` uses for its siteHosts, so the two tabs agree on
// which companies have a custom domain.
function hasCustomDomain(c: GeneratedCompany) {
  return c.status !== "closed" && c.status !== "pending" && mulberry32(c.index * 7919)() < 0.3;
}

const ISSUES = ["No CNAME record found for the hostname", "CNAME points to a different host", "TLS certificate could not be issued yet"];

function customDomainStatus(index: number): CustomDomainStatus {
  if (index % 17 === 0) return "failed";
  if (index % 11 === 0) return "pending";
  return "verified";
}

const STATUS_RANK: Record<CustomDomainStatus, number> = { failed: 0, pending: 1, verified: 2 };

export async function listCustomDomains(page: number): Promise<Paged<CustomDomain>> {
  await connection();
  const now = Date.now();
  const domains = allCompanies(now)
    .filter(hasCustomDomain)
    .map((c): CustomDomain => {
      const rng = mulberry32(c.index * 131);
      const status = customDomainStatus(c.index);
      const requestedDaysAgo = Math.max(c.daysAgo - 2 - rng() * 20, 0.3);
      return {
        id: `dom_${c.index}`,
        companyId: c.id,
        companyName: c.name,
        hostname: `www.${c.slug}.lk`,
        status,
        requestedAt: new Date(now - requestedDaysAgo * DAY_MS).toISOString(),
        checkedAt: new Date(now - Math.floor(rng() * DOMAIN_SETTINGS.checkIntervalMinutes) * 60_000).toISOString(),
        issue: status === "failed" ? ISSUES[c.index % ISSUES.length] : null,
      };
    })
    .sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || b.requestedAt.localeCompare(a.requestedAt));

  const safePage = Math.min(Math.max(page, 1), Math.max(Math.ceil(domains.length / CUSTOM_DOMAIN_PAGE_SIZE), 1));
  const start = (safePage - 1) * CUSTOM_DOMAIN_PAGE_SIZE;
  return { items: domains.slice(start, start + CUSTOM_DOMAIN_PAGE_SIZE), total: domains.length, page: safePage, pageSize: CUSTOM_DOMAIN_PAGE_SIZE };
}

export async function getCustomDomainCounts(): Promise<Record<CustomDomainStatus, number> & { all: number }> {
  const { total } = await listCustomDomains(1);
  const all = allCompanies(Date.now()).filter(hasCustomDomain);
  const count = (status: CustomDomainStatus) => all.filter((c) => customDomainStatus(c.index) === status).length;
  return { all: total, verified: count("verified"), pending: count("pending"), failed: count("failed") };
}

// --- Website templates --------------------------------------------------------------

// Shared with the website-request fixtures.
export const WEBSITE_TEMPLATES: Omit<WebsiteTemplate, "companies">[] = [
  { id: "tpl_coast", name: "Coast", description: "Full-width photography, sea-facing hero and a booking bar that stays in view.", suitedTo: "Beach villas and resorts", pages: ["Home", "Rooms", "Gallery", "Location", "Contact", "Book"], updatedAt: "2026-09-28" },
  { id: "tpl_hillside", name: "Hillside", description: "Warm tones and long-form storytelling for tea country and highland stays.", suitedTo: "Lodges, cabins and homestays", pages: ["Home", "Rooms", "Experiences", "Gallery", "Contact", "Book"], updatedAt: "2026-08-14" },
  { id: "tpl_heritage", name: "Heritage", description: "Editorial layout with serif headings and room-by-room detail pages.", suitedTo: "Boutique hotels and colonial houses", pages: ["Home", "Rooms", "Dining", "Gallery", "History", "Contact", "Book"], updatedAt: "2026-07-02" },
  { id: "tpl_minimal", name: "Minimal", description: "One page, fast to build: rooms, rates, map and a booking button.", suitedTo: "Guest houses and small B&Bs", pages: ["Home", "Book"], updatedAt: "2026-10-05" },
];

// Which template a company's site uses; weighted towards Coast and Minimal.
function templateFor(index: number) {
  const roll = (index * 7) % 10;
  return roll < 4 ? 0 : roll < 6 ? 1 : roll < 7 ? 2 : 3;
}

export async function listWebsiteTemplates(): Promise<WebsiteTemplate[]> {
  await connection();
  const live = allCompanies(Date.now()).filter((c) => c.status !== "closed" && c.status !== "pending");
  return WEBSITE_TEMPLATES.map((template, i) => ({ ...template, companies: live.filter((c) => templateFor(c.index) === i).length }));
}
