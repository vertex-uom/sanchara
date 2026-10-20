import { connection } from "next/server";
import type { Paged, StaffFilters, StaffRole, StaffStatus, StaffUser, StaffUserDetail } from "../types";
import { allCompanies, companyPropertyNames, type GeneratedCompany } from "./accounts";
import { DAY_MS, dayKey, FIRST_NAMES, LAST_NAMES, mulberry32, pick } from "./fixtures";

// TEMPORARY fixtures for Users. Replace each exported function's body with
// the platform-admin API call once it exists; the signatures and return
// types stay the same. Only staff accounts (Owner, Manager, Front Desk) —
// Platform Admin never reads guests.
//
// Staff are derived from the Accounts fixtures so the numbers agree: 312
// companies, 1,148 staff (the Overview KPI). Owners of pending companies
// are still "invited"; a handful of accounts are locked.

export const USER_PAGE_SIZE = 8;

const CLIENTS = ["Chrome on Windows", "Chrome on macOS", "Safari on iPhone", "Chrome on Android", "Edge on Windows", "Firefox on Ubuntu"];
const ROLE_ORDER: StaffRole[] = ["owner", "manager", "front-desk"];

type Generated = StaffUser & {
  index: number;
  company: GeneratedCompany;
  propertyIndex: number;
  lastActiveDaysAgo: number | null;
};

let cache: { now: number; users: Generated[] } | null = null;

function users(now: number): Generated[] {
  if (cache && dayKey(cache.now) === dayKey(now)) return cache.users;

  const list: Generated[] = [];
  let index = 0;
  for (const company of allCompanies(now)) {
    const rng = mulberry32(company.index * 104729);
    const roles: StaffRole[] = [
      ...Array<StaffRole>(company.staff.owners).fill("owner"),
      ...Array<StaffRole>(company.staff.managers).fill("manager"),
      ...Array<StaffRole>(company.staff.frontDesk).fill("front-desk"),
    ];
    const used = new Set<string>([company.ownerName]);

    roles.forEach((role, i) => {
      index += 1;
      let name = role === "owner" ? company.ownerName : `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
      while (role !== "owner" && used.has(name)) name = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
      used.add(name);

      // Staff join after the company; owners on day one.
      const createdDaysAgo = role === "owner" ? company.daysAgo : Math.max(company.daysAgo - 1 - rng() * Math.min(company.daysAgo, 120), 0.2);

      let status: StaffStatus = "active";
      if (company.status === "pending") status = "invited";
      else if (createdDaysAgo < 4 && rng() < 0.6) status = "invited";
      else if (rng() < 0.012) status = "locked";

      let lastActiveDaysAgo: number | null = null;
      if (status !== "invited") {
        const r = rng();
        const suspended = company.status !== "active";
        lastActiveDaysAgo = suspended
          ? 3 + r * 40
          : r < 0.55
            ? rng() * 0.9
            : r < 0.8
              ? 1 + rng() * 6
              : r < 0.92
                ? 7 + rng() * 23
                : 31 + rng() * 120;
        lastActiveDaysAgo = Math.min(lastActiveDaysAgo, Math.max(createdDaysAgo - 0.1, 0.05));
      }

      const [first, last] = name.split(" ");
      list.push({
        index,
        id: `usr_${String(index).padStart(4, "0")}`,
        name,
        email: `${first.toLowerCase()}.${last.replace(/\s/g, "").slice(0, 1).toLowerCase()}@${company.slug}.lk`,
        role,
        status,
        companyId: company.id,
        companyName: company.name,
        companyStatus: company.status,
        lastActiveAt: lastActiveDaysAgo === null ? null : new Date(now - lastActiveDaysAgo * DAY_MS).toISOString(),
        createdAt: new Date(now - createdDaysAgo * DAY_MS).toISOString(),
        company,
        propertyIndex: role === "front-desk" ? i % company.propertyCount : 0,
        lastActiveDaysAgo,
      });
    });
  }
  cache = { now, users: list };
  return list;
}

const strip = (u: Generated): StaffUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  status: u.status,
  companyId: u.companyId,
  companyName: u.companyName,
  companyStatus: u.companyStatus,
  lastActiveAt: u.lastActiveAt,
  createdAt: u.createdAt,
});

// --- Public API ---------------------------------------------------------------

export async function getStaffRoleCounts(): Promise<Record<"all" | StaffRole, number>> {
  await connection();
  const all = users(Date.now());
  return {
    all: all.length,
    owner: all.filter((u) => u.role === "owner").length,
    manager: all.filter((u) => u.role === "manager").length,
    "front-desk": all.filter((u) => u.role === "front-desk").length,
  };
}

// Companies for the filter select, A–Z.
export async function getStaffFilterOptions(): Promise<{ companies: { id: string; name: string }[] }> {
  await connection();
  return {
    companies: allCompanies(Date.now())
      .map((c) => ({ id: c.id, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

function matchesActivity(u: Generated, activity: StaffFilters["activity"]) {
  switch (activity) {
    case "any":
      return true;
    case "24h":
      return u.lastActiveDaysAgo !== null && u.lastActiveDaysAgo < 1;
    case "7d":
      return u.lastActiveDaysAgo !== null && u.lastActiveDaysAgo < 7;
    case "30d":
      return u.lastActiveDaysAgo !== null && u.lastActiveDaysAgo < 30;
    case "inactive":
      return u.lastActiveDaysAgo === null || u.lastActiveDaysAgo >= 30;
  }
}

export async function listStaff(filters: StaffFilters): Promise<Paged<StaffUser>> {
  await connection();
  const q = filters.q.trim().toLowerCase();

  const matches = users(Date.now()).filter((u) => {
    if (filters.role !== "all" && u.role !== filters.role) return false;
    if (filters.status !== "all" && u.status !== filters.status) return false;
    if (filters.company && u.companyId !== filters.company) return false;
    if (!matchesActivity(u, filters.activity)) return false;
    if (q && ![u.name, u.email, u.id, u.companyName].some((v) => v.toLowerCase().includes(q))) return false;
    return true;
  });

  matches.sort((a, b) => {
    if (filters.sort === "name") return a.name.localeCompare(b.name);
    if (filters.sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    // Most recently active first; pending invites last.
    const ad = a.lastActiveDaysAgo ?? Number.POSITIVE_INFINITY;
    const bd = b.lastActiveDaysAgo ?? Number.POSITIVE_INFINITY;
    return ad - bd || ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role);
  });

  const page = Math.min(Math.max(filters.page, 1), Math.max(Math.ceil(matches.length / USER_PAGE_SIZE), 1));
  const start = (page - 1) * USER_PAGE_SIZE;
  return { items: matches.slice(start, start + USER_PAGE_SIZE).map(strip), total: matches.length, page, pageSize: USER_PAGE_SIZE };
}

export async function getStaffUser(id: string): Promise<StaffUserDetail | null> {
  await connection();
  const now = Date.now();
  const user = users(now).find((u) => u.id === id);
  if (!user) return null;

  const rng = mulberry32(user.index * 7331);
  const properties = companyPropertyNames(user.company);
  const invited = user.status === "invited";
  const locked = user.status === "locked";
  const lastLogin =
    user.lastActiveAt === null
      ? null
      : {
          at: user.lastActiveAt,
          client: pick(rng, CLIENTS),
          location: rng() < 0.75 ? `${user.company.location}, LK` : "Colombo, LK",
        };

  return {
    ...strip(user),
    phone: rng() < 0.7 ? `+94 7${Math.floor(rng() * 8)} •••• ${String(100 + Math.floor(rng() * 900))}` : null,
    signInMethod: rng() < 0.35 ? "google" : "password",
    properties: user.role === "front-desk" ? [properties[user.propertyIndex]] : properties,
    invitedBy: user.role === "owner" ? "Sanchara (created by the platform team)" : user.company.ownerName,
    activatedAt: invited ? null : new Date(new Date(user.createdAt).getTime() + (0.1 + rng() * 2) * DAY_MS).toISOString(),
    security: {
      lastLogin,
      activeSessions: invited || locked ? 0 : user.lastActiveDaysAgo !== null && user.lastActiveDaysAgo < 7 ? 1 + Math.floor(rng() * 3) : 0,
      failedLogins24h: locked ? 5 + Math.floor(rng() * 4) : rng() < 0.08 ? 1 + Math.floor(rng() * 2) : 0,
      // The lock follows the last successful sign-in.
      lockedAt: locked ? new Date(Math.min(now - 3_600_000, new Date(user.lastActiveAt ?? now).getTime() + (0.2 + rng() * 1.5) * DAY_MS)).toISOString() : null,
    },
  };
}
