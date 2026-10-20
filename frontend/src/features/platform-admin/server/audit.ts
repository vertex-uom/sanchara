import { connection } from "next/server";
import { companyHref } from "../accounts/search-params";
import { announcementHref } from "../announcements/search-params";
import { configurationHref } from "../configuration/search-params";
import { exchangeRateHref } from "../finance/search-params";
import { adminNavItem } from "../nav";
import type { AdminAccount, AuditCategory, AuditChange, AuditEvent, AuditFilters, AuditTarget, EnforcementEntry, Paged } from "../types";
import { allCompanies, listEnforcementLog, listWebsiteRequests } from "./accounts";
import { allAdmins, listAdminAccountChanges } from "./admin-users";
import { allAnnouncements } from "./announcements";
import { listExchangeRateHistory } from "./finance";
import { companyCreatedAt, companyCreatedBy } from "./onboarding";
import { DAY_MS, dayKey, mulberry32, pick } from "./fixtures";

// TEMPORARY fixtures for Audit Logs. Events are derived from the other tabs'
// fixtures (enforcement log, admin account changes, exchange-rate history,
// announcements, website requests, recent approvals) plus generated sign-ins,
// so every entry here matches something visible elsewhere in the console.
// Replace each exported function with the platform-admin API call once it
// exists. Only platform-team actions: never company-staff activity.

export const AUDIT_PAGE_SIZE = 20;
export const AUDIT_RETENTION_DAYS = 365;

const HOUR_MS = 60 * 60 * 1000;
const SYSTEM = { id: "system", name: "System", email: null };
const OFFICE_IPS = ["10.0.4.21", "10.0.4.22", "10.0.4.30", "10.0.5.11"];
const REMOTE_IPS = ["112.134.•••.88", "175.157.•••.12", "124.43.•••.201"];

const hrefs = () => ({
  company: (id: string) => companyHref(id),
  adminUsers: adminNavItem("admin-users").href,
  announcement: (id: string) => announcementHref(id),
  exchangeRate: exchangeRateHref(),
  plans: configurationHref("plans"),
  templates: configurationHref("templates"),
});

let cache: { now: number; events: AuditEvent[] } | null = null;

async function allEvents(now: number): Promise<AuditEvent[]> {
  if (cache && dayKey(cache.now) === dayKey(now)) return cache.events;

  const rng = mulberry32(2026);
  const admins = allAdmins(now);
  const byName = new Map(admins.map((a) => [a.name, a]));
  const actorFor = (name: string) => {
    if (name === "System") return SYSTEM;
    const admin = byName.get(name);
    return admin ? { id: admin.id, name: admin.name, email: admin.email } : { id: `adm_${name.toLowerCase().replace(/\s+/g, "-")}`, name, email: null };
  };
  const ip = () => (rng() < 0.8 ? pick(rng, OFFICE_IPS) : pick(rng, REMOTE_IPS));
  const to = hrefs();
  const events: AuditEvent[] = [];
  const push = (event: Omit<AuditEvent, "critical" | "failed" | "ip" | "changes" | "note"> & Partial<Pick<AuditEvent, "critical" | "failed" | "ip" | "changes" | "note">>) =>
    events.push({ critical: false, failed: false, ip: event.actor.id === "system" ? null : ip(), changes: [], note: null, ...event });

  // --- Companies: enforcement log -----------------------------------------
  const ENFORCEMENT: Record<EnforcementEntry["kind"], { action: string; change: AuditChange | null; critical?: boolean }> = {
    suspended: { action: "Company suspended", change: { field: "Status", before: "Active", after: "Suspended" } },
    reactivated: { action: "Company reactivated", change: { field: "Status", before: "Suspended", after: "Active" } },
    "suspended-nonpayment": { action: "Access blocked for non-payment", change: { field: "Status", before: "Active", after: "Blocked" } },
    "reactivated-payment": { action: "Access restored after payment", change: { field: "Status", before: "Blocked", after: "Active" } },
    closed: { action: "Company closed · data deleted", change: { field: "Status", before: "Blocked", after: "Closed" }, critical: true },
    warning: { action: "Warning sent to owner", change: null },
  };
  for (const entry of await listEnforcementLog()) {
    const meta = ENFORCEMENT[entry.kind];
    push({
      id: `aud_${entry.id}`,
      at: entry.occurredAt,
      action: meta.action,
      category: "companies",
      critical: meta.critical || entry.critical === true,
      actor: actorFor(entry.actor),
      target: { kind: "company", id: entry.companyId, label: entry.companyName, href: to.company(entry.companyId) },
      changes: meta.change ? [meta.change] : [],
      note: entry.reason,
    });
  }

  // --- Companies: created by the platform team (recent joins) --------------
  for (const c of allCompanies(now).filter((c) => c.daysAgo <= 60 && c.index !== 312)) {
    push({
      id: `aud_new_${c.index}`,
      at: new Date(Math.min(companyCreatedAt(c), now - HOUR_MS)).toISOString(),
      action: "Company created · Owner login issued",
      category: "companies",
      actor: actorFor(companyCreatedBy(c)),
      target: { kind: "company", id: c.id, label: c.name, href: to.company(c.id) },
      changes: [{ field: "Status", before: null, after: "Pending setup" }],
      note: `Owner ${c.ownerName} · ${c.plan} plan · ${c.location} · credentials emailed, valid 72 h`,
    });
  }
  // Credentials re-issued for Owners who had not signed in.
  for (const [index, hoursAgo] of [[307, 9], [305, 30], [301, 60], [295, 4]] as const) {
    const c = allCompanies(now)[index - 1];
    push({ id: `aud_regen_${index}`, at: new Date(now - hoursAgo * HOUR_MS).toISOString(), action: "Owner credentials regenerated", category: "companies", actor: actorFor(companyCreatedBy(c)), target: { kind: "company", id: c.id, label: c.name, href: to.company(c.id) }, note: `Previous link expired · new link and password emailed to the Owner, valid 72 h` });
  }

  // --- Admin users --------------------------------------------------------
  const ADMIN_CHANGE = { invited: ["Admin user invited", null, "Invited"], activated: ["Admin user activated", "Invited", "Active"], deactivated: ["Admin user deactivated", "Active", "Deactivated"], reactivated: ["Admin user reactivated", "Deactivated", "Active"] } as const;
  for (const change of await listAdminAccountChanges()) {
    const [action, before, after] = ADMIN_CHANGE[change.kind];
    const subject = byName.get(change.adminName);
    push({
      id: `aud_${change.id}`,
      at: change.occurredAt,
      action,
      category: "admin-users",
      critical: change.kind === "deactivated",
      actor: actorFor(change.actor),
      target: { kind: "admin-user", id: subject?.id ?? change.adminName, label: subject ? `${subject.name} · ${subject.email}` : change.adminName, href: to.adminUsers },
      changes: [{ field: "Status", before, after }],
    });
  }

  // --- Finance: exchange rate ---------------------------------------------
  for (const rate of await listExchangeRateHistory()) {
    push({
      id: `aud_${rate.id}`,
      at: rate.setAt,
      action: "Exchange rate updated",
      category: "finance",
      actor: actorFor(rate.setBy),
      target: { kind: "exchange-rate", id: "usd-lkr", label: "USD → LKR", href: to.exchangeRate },
      changes: [{ field: "USD → LKR", before: rate.previous === null ? null : rate.previous.toFixed(2), after: rate.usdToLkr.toFixed(2) }],
      note: rate.note,
    });
  }

  // --- Announcements ------------------------------------------------------
  for (const a of allAnnouncements(now)) {
    const target: AuditTarget = { kind: "announcement", id: a.id, label: a.title, href: to.announcement(a.id) };
    const scheduled = new Date(a.startsAt).getTime() > new Date(a.createdAt).getTime() + HOUR_MS;
    push({ id: `aud_${a.id}_c`, at: a.createdAt, action: scheduled ? "Announcement scheduled" : "Announcement published", category: "announcements", critical: a.type === "urgent", actor: actorFor(a.createdBy), target, note: `${a.audience === "all-staff" ? "All staff" : a.audience[0].toUpperCase() + a.audience.slice(1).replace("-", " ")} · ${a.channels.join(" + ")}` });
    if (a.archivedAt) push({ id: `aud_${a.id}_a`, at: a.archivedAt, action: "Announcement archived early", category: "announcements", actor: actorFor(a.createdBy), target, changes: [{ field: "Status", before: "Active", after: "Archived" }] });
  }

  // --- Websites -----------------------------------------------------------
  const BUILDERS = ["Ruwan Perera", "Admin User"];
  for (const request of await listWebsiteRequests()) {
    const target: AuditTarget = { kind: "company", id: request.companyId, label: request.companyName, href: to.company(request.companyId) };
    const requestedAt = new Date(request.requestedAt).getTime();
    if (request.status !== "requested") push({ id: `aud_${request.id}_b`, at: new Date(requestedAt + (6 + rng() * 20) * HOUR_MS).toISOString(), action: "Website build started", category: "websites", actor: actorFor(pick(rng, BUILDERS)), target, note: "Heritage template" });
    if (request.status === "review") push({ id: `aud_${request.id}_r`, at: new Date(requestedAt + (40 + rng() * 20) * HOUR_MS).toISOString(), action: "Website sent to owner for review", category: "websites", actor: actorFor(pick(rng, BUILDERS)), target });
  }
  // Builds finished before the current queue.
  for (const c of allCompanies(now).filter((c) => [288, 283, 279, 271, 265].includes(c.index))) {
    const at = now - (8 + rng() * 40) * DAY_MS;
    push({ id: `aud_web_${c.index}_p`, at: new Date(at).toISOString(), action: "Company website published", category: "websites", actor: actorFor(pick(rng, BUILDERS)), target: { kind: "company", id: c.id, label: c.name, href: to.company(c.id) }, changes: [{ field: "Website", before: "In review", after: "Published" }], note: `${c.slug}.sanchara.lk` });
  }

  // --- Configuration ------------------------------------------------------
  const config = [
    { id: "aud_cfg_1", daysAgo: 3.2, actor: "Admin User", action: "Website template published", target: { kind: "template", id: "tpl_heritage", label: "Heritage", href: to.templates } as AuditTarget, changes: [{ field: "Status", before: "Draft", after: "Published" }] },
    { id: "aud_cfg_2", daysAgo: 12.6, actor: "Nimal Perera", action: "Plan price updated", target: { kind: "plan", id: "plan_standard", label: "Standard", href: to.plans } as AuditTarget, changes: [{ field: "Monthly price", before: "LKR 6,500", after: "LKR 6,900" }], critical: true },
    { id: "aud_cfg_3", daysAgo: 12.6, actor: "Nimal Perera", action: "Plan price updated", target: { kind: "plan", id: "plan_pro", label: "Pro", href: to.plans } as AuditTarget, changes: [{ field: "Monthly price", before: "LKR 9,900", after: "LKR 10,900" }], critical: true },
    { id: "aud_cfg_4", daysAgo: 27, actor: "Admin User", action: "Plan limit changed", target: { kind: "plan", id: "plan_starter", label: "Starter", href: to.plans } as AuditTarget, changes: [{ field: "Properties", before: "1", after: "2" }] },
    { id: "aud_cfg_5", daysAgo: 41, actor: "Ruwan Perera", action: "Reserved subdomain added", target: null, changes: [{ field: "Reserved", before: null, after: "help" }] },
  ];
  for (const { daysAgo, actor, ...rest } of config) push({ ...rest, at: new Date(now - daysAgo * DAY_MS - 3 * HOUR_MS).toISOString(), category: "configuration", actor: actorFor(actor) });

  // --- Sign-ins -----------------------------------------------------------
  // Only the admins who act elsewhere in the console plus a few others, so
  // sign-ins do not drown out the actions on the first page.
  const activeAdmins = admins.filter((a, i): a is AdminAccount & { lastSignInAt: string } => a.status === "active" && a.lastSignInAt !== null && (i < 4 || i % 7 === 0));
  for (const admin of activeAdmins) {
    const actor = actorFor(admin.name);
    push({ id: `aud_in_${admin.id}_0`, at: admin.lastSignInAt, action: "Signed in", category: "sign-ins", actor, target: null, note: "Two-step verification · authenticator app" });
    // Earlier sign-ins over the last month.
    const earlier = 1 + Math.floor(rng() * 3);
    for (let i = 1; i <= earlier; i++) {
      push({ id: `aud_in_${admin.id}_${i}`, at: new Date(new Date(admin.lastSignInAt).getTime() - (i * 2 + rng() * 5) * DAY_MS).toISOString(), action: "Signed in", category: "sign-ins", actor, target: null, note: "Two-step verification · authenticator app" });
    }
  }
  // Failed attempts: an invited account that has not completed setup.
  const tara = byName.get("Tara Lee");
  const failedAt = now - 2.1 * DAY_MS;
  for (let i = 0; i < 5; i++) {
    push({ id: `aud_fail_${i}`, at: new Date(failedAt + i * 70_000).toISOString(), action: "Sign-in failed", category: "sign-ins", failed: true, critical: i === 4, actor: { id: "unknown", name: "Unknown", email: null }, target: tara ? { kind: "admin-user", id: tara.id, label: `${tara.name} · ${tara.email}`, href: to.adminUsers } : null, ip: "185.220.•••.14", note: i === 4 ? "5 failed attempts in 5 minutes · account locked for 30 minutes" : "Wrong password" });
  }
  push({ id: "aud_fail_m", at: new Date(now - 9.4 * DAY_MS).toISOString(), action: "Sign-in failed", category: "sign-ins", failed: true, actor: actorFor("Marcus Hall"), target: null, ip: pick(rng, REMOTE_IPS), note: "Account deactivated" });

  const kept = events.filter((e) => now - new Date(e.at).getTime() <= AUDIT_RETENTION_DAYS * DAY_MS && new Date(e.at).getTime() <= now);
  kept.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  cache = { now, events: kept };
  return kept;
}

const RANGE_DAYS: Record<Exclude<AuditFilters["range"], "all" | "today">, number> = { "7d": 7, "30d": 30 };

function startOfToday(now: number) {
  const [y, m, d] = dayKey(now).split("-").map(Number);
  return Date.UTC(y, m - 1, d) - 5.5 * HOUR_MS;
}

function matches(event: AuditEvent, filters: AuditFilters, now: number) {
  if (filters.category && event.category !== filters.category) return false;
  if (filters.actor && event.actor.id !== filters.actor) return false;
  if (filters.critical && !event.critical) return false;
  const at = new Date(event.at).getTime();
  if (filters.range === "today" && at < startOfToday(now)) return false;
  if (filters.range !== "all" && filters.range !== "today" && at < now - RANGE_DAYS[filters.range] * DAY_MS) return false;
  if (filters.q) {
    const q = filters.q.toLowerCase();
    const haystack = [event.id, event.action, event.actor.name, event.actor.email, event.target?.label, event.target?.id, event.ip, event.note].filter(Boolean).join(" ").toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

// --- Public API ---------------------------------------------------------------

export async function listAuditEvents(filters: AuditFilters): Promise<Paged<AuditEvent>> {
  await connection();
  const now = Date.now();
  const all = (await allEvents(now)).filter((e) => matches(e, filters, now));
  const page = Math.min(Math.max(filters.page, 1), Math.max(Math.ceil(all.length / AUDIT_PAGE_SIZE), 1));
  const start = (page - 1) * AUDIT_PAGE_SIZE;
  return { items: all.slice(start, start + AUDIT_PAGE_SIZE), total: all.length, page, pageSize: AUDIT_PAGE_SIZE };
}

export async function getAuditEvent(id: string): Promise<AuditEvent | null> {
  await connection();
  return (await allEvents(Date.now())).find((e) => e.id === id) ?? null;
}

// Everyone who appears as an actor, for the Actor filter. "System" last.
export async function listAuditActors(): Promise<{ id: string; name: string }[]> {
  await connection();
  const seen = new Map<string, string>();
  for (const e of await allEvents(Date.now())) if (e.actor.id !== "unknown") seen.set(e.actor.id, e.actor.name);
  return [...seen.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => (a.id === "system" ? 1 : b.id === "system" ? -1 : a.name.localeCompare(b.name)));
}

export const AUDIT_CATEGORIES: readonly AuditCategory[] = ["companies", "admin-users", "finance", "configuration", "announcements", "websites", "sign-ins"];
