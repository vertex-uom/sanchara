import { connection } from "next/server";
import type { AdminAccount, AdminAccountChange, AdminAccountStatus, Paged } from "../types";
import { DAY_MS, dayKey, FIRST_NAMES, LAST_NAMES, mulberry32, pick } from "./fixtures";

// TEMPORARY fixtures for Admin Users. Replace each exported function's body
// with the platform-admin API call once it exists; the signatures and return
// types stay the same.
//
// 34 platform-team accounts: 31 active · 2 invited · 1 deactivated. The first
// one is the fixture Platform Admin from lib/auth/admin.ts, so "You" lines up
// with the signed-in user. The names used as actors elsewhere in the console
// (enforcement log, onboarding) are real admins here.

export const ADMIN_PAGE_SIZE = 10;

const TOTAL = 34;
const HOUR_MS = 60 * 60 * 1000;

const NAMED: { id: string; name: string; email: string; status?: AdminAccountStatus; hoursAgo?: number }[] = [
  { id: "admin_fixture_1", name: "Admin User", email: "admin@sanchara.io", hoursAgo: 0.1 },
  { id: "adm_02", name: "Nimal Perera", email: "nimal.p@sanchara.io", hoursAgo: 0.6 },
  { id: "adm_03", name: "Kamala Silva", email: "kamala.s@sanchara.io", hoursAgo: 26 },
  { id: "adm_04", name: "Ruwan Perera", email: "ruwan.p@sanchara.io", hoursAgo: 1.4 },
  { id: "adm_05", name: "Tara Lee", email: "tara.l@sanchara.io", status: "invited" },
  { id: "adm_06", name: "Dilani Herath", email: "dilani.h@sanchara.io", status: "invited" },
  { id: "adm_07", name: "Marcus Hall", email: "marcus.h@sanchara.io", status: "deactivated", hoursAgo: 64 * 24 },
];

let cache: { now: number; admins: AdminAccount[] } | null = null;

function admins(now: number): AdminAccount[] {
  if (cache && dayKey(cache.now) === dayKey(now)) return cache.admins;

  const rng = mulberry32(7);
  const used = new Set(NAMED.map((n) => n.name));
  const list: AdminAccount[] = [];

  for (let i = 0; i < TOTAL; i++) {
    const named = NAMED[i];
    let name = named?.name ?? `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
    while (!named && used.has(name)) name = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
    used.add(name);
    const [first, last] = name.split(" ");

    const status: AdminAccountStatus = named?.status ?? "active";
    // Invites are recent; the team has grown over ~2 years.
    const addedDaysAgo = status === "invited" ? 2 + i * 3 : i === 0 ? 730 : 30 + rng() * 650;
    const hoursAgo = named?.hoursAgo ?? (rng() < 0.7 ? rng() * 10 : 24 + rng() * 240);

    list.push({
      id: named?.id ?? `adm_${String(i + 1).padStart(2, "0")}`,
      name,
      email: named?.email ?? `${first.toLowerCase()}.${last.replace(/\s/g, "").slice(0, 1).toLowerCase()}@sanchara.io`,
      status,
      twoStep: status === "invited" ? "pending" : "on",
      lastSignInAt: status === "invited" ? null : new Date(now - hoursAgo * HOUR_MS).toISOString(),
      addedAt: new Date(now - addedDaysAgo * DAY_MS).toISOString(),
      addedBy: i === 0 ? "Sanchara (initial setup)" : "Admin User",
    });
  }
  cache = { now, admins: list };
  return list;
}

const STATUS_ORDER: AdminAccountStatus[] = ["invited", "active", "deactivated"];

// --- Public API ---------------------------------------------------------------

export async function getAdminCounts(): Promise<Record<"all" | AdminAccountStatus, number>> {
  await connection();
  const all = admins(Date.now());
  return {
    all: all.length,
    active: all.filter((a) => a.status === "active").length,
    invited: all.filter((a) => a.status === "invited").length,
    deactivated: all.filter((a) => a.status === "deactivated").length,
  };
}

// Invited first (they need action), then active by last sign-in, then
// deactivated.
export async function listAdmins(page: number): Promise<Paged<AdminAccount>> {
  await connection();
  const sorted = [...admins(Date.now())].sort((a, b) => {
    const order = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    if (order !== 0) return order;
    return new Date(b.lastSignInAt ?? b.addedAt).getTime() - new Date(a.lastSignInAt ?? a.addedAt).getTime();
  });
  const safePage = Math.min(Math.max(page, 1), Math.max(Math.ceil(sorted.length / ADMIN_PAGE_SIZE), 1));
  const start = (safePage - 1) * ADMIN_PAGE_SIZE;
  return { items: sorted.slice(start, start + ADMIN_PAGE_SIZE), total: sorted.length, page: safePage, pageSize: ADMIN_PAGE_SIZE };
}

// Newest first. Only account-lifecycle events; there is no role or
// permission history because there is one role.
export async function listAdminAccountChanges(): Promise<AdminAccountChange[]> {
  await connection();
  const now = Date.now();
  const at = (daysAgo: number) => new Date(now - daysAgo * DAY_MS).toISOString();
  return [
    { id: "chg_1", kind: "invited", adminName: "Dilani Herath", actor: "Admin User", occurredAt: at(2.3) },
    { id: "chg_2", kind: "invited", adminName: "Tara Lee", actor: "Admin User", occurredAt: at(5.1) },
    { id: "chg_3", kind: "activated", adminName: "Ruwan Perera", actor: "Ruwan Perera", occurredAt: at(19) },
    { id: "chg_4", kind: "invited", adminName: "Ruwan Perera", actor: "Admin User", occurredAt: at(21) },
    { id: "chg_5", kind: "deactivated", adminName: "Marcus Hall", actor: "Admin User", occurredAt: at(64) },
    { id: "chg_6", kind: "reactivated", adminName: "Kamala Silva", actor: "Admin User", occurredAt: at(88) },
    { id: "chg_7", kind: "deactivated", adminName: "Kamala Silva", actor: "Nimal Perera", occurredAt: at(95) },
  ];
}
