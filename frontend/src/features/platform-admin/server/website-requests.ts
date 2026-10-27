import { connection } from "next/server";
import { colomboDateKey, HOUR_MS } from "@/lib/format/dates";
import type { WebsiteRequestAssignee, WebsiteRequestDetail, WebsiteRequestEvent, WebsiteRequestFilters, WebsiteRequestNote, WebsiteRequestStatus } from "../types";
import { allCompanies, companyContact, companyPropertyNames, customDomainFor, listWebsiteRequests, PLATFORM_DOMAIN, staffEmail, type GeneratedCompany } from "./accounts";
import { allAdmins } from "./admin-users";
import { WEBSITE_TEMPLATES } from "./configuration";
import { mulberry32 } from "./fixtures";

// What each Owner asked for when requesting a website from the Back Office,
// and the platform team's work on it so far. Built on the open requests in
// `server/accounts.ts`; the Audit Logs fixtures read the same timelines.

// Who on the team holds each request (admin ids from `server/admin-users.ts`).
// New requests wait for someone to pick them up.
const ASSIGNEES: Record<number, string | null> = {
  311: null,
  306: null,
  304: "adm_03",
  302: "adm_04",
  300: "adm_02",
  298: null,
  294: "adm_04",
  292: "adm_03",
  290: "adm_04",
};
const ASSIGNED_BY = "Admin User";

// Template the Owner picked, from the kind of place they run.
function templateIdFor(company: GeneratedCompany) {
  if (/Boutique Hotel/.test(company.name)) return "tpl_heritage";
  if (/Villa|Resort/.test(company.name)) return "tpl_coast";
  if (/Lodge|Cabins|Homestay|Cottage|Retreat/.test(company.name)) return "tpl_hillside";
  return "tpl_minimal";
}

const EXTRA_PAGES = ["Offers", "Experiences", "Getting here", "FAQ", "Events"];

// prettier-ignore
const OWNER_NOTES = [
  "Please lead with the sunset photos from the roof terrace. Many of our guests are from Germany, so keep the wording simple.",
  "We want the booking button on every page. Our old site had no rates; please show rates from LKR.",
  "Use our logo as it is (the green one). Add a page for our Ayurveda treatments if the template allows it.",
  "Mention that we are five minutes from the railway station. Photos of the tea estate walk are in the zip.",
  "English only for now, Sinhala later. Our colours are in the brand guide.",
  "Mostly families and surfers. Please mention board storage and the kids' pool.",
  "No stock photos please, only ours. The drone shots are the best ones.",
  "The annex opens in December; keep it off the site until then and we will tell you.",
];

// Owner-supplied brand colours (content, not console tokens). Null: none sent.
// prettier-ignore
const PALETTES: (string[] | null)[] = [["#0E5E6F", "#F2C14E"], ["#2D6A4F", "#F4F1DE"], null, ["#7A3E2B", "#E9C46A"], ["#1D3557", "#E63946", "#F1FAEE"], ["#264653", "#2A9D8F"]];

// prettier-ignore
const TEAM_NOTES = [
  "Owner sent extra room photos on WhatsApp; added them to the shared folder.",
  "Waiting on the Owner for the annex room rates before the Rooms page is final.",
  "Hero image is low resolution; asked the Owner for the original file.",
  "Owner prefers the booking bar at the top on mobile. Done in the preview.",
];

let cache: { now: number; requests: WebsiteRequestDetail[] } | null = null;

// Every open request with its details, soonest due first.
export async function allWebsiteRequestDetails(now: number): Promise<WebsiteRequestDetail[]> {
  if (cache && colomboDateKey(new Date(cache.now)) === colomboDateKey(new Date(now))) return cache.requests;

  const companies = allCompanies(now);
  const admins = new Map(allAdmins(now).map((a) => [a.id, a]));
  const requests = (await listWebsiteRequests()).map((request): WebsiteRequestDetail => {
    const company = companies.find((c) => c.id === request.companyId)!;
    const rng = mulberry32(company.index * 104729);
    const template = WEBSITE_TEMPLATES.find((t) => t.id === templateIdFor(company))!;
    const assigneeId = ASSIGNEES[company.index] ?? null;
    const admin = assigneeId ? admins.get(assigneeId) : undefined;
    const assignee: WebsiteRequestAssignee | null = admin ? { id: admin.id, name: admin.name } : null;

    const extras = EXTRA_PAGES.filter(() => rng() < 0.3).slice(0, 2);
    const pages = [...template.pages.map((name) => ({ name, extra: false })), ...extras.map((name) => ({ name, extra: true }))];
    const photoCount = 12 + Math.floor(rng() * 40);
    const colours = PALETTES[company.index % PALETTES.length] ?? [];
    const custom = customDomainFor(company);

    return {
      ...request,
      templateName: template.name,
      assignee,
      plan: company.plan,
      owner: { name: company.ownerName, email: staffEmail(company.ownerName, company), phone: companyContact(company) },
      template: { id: template.id, name: template.name, suitedTo: template.suitedTo },
      pages,
      assets: [
        { name: `${company.slug}-logo.${rng() < 0.6 ? "svg" : "png"}`, kind: "logo", detail: `Logo · ${20 + Math.floor(rng() * 300)} KB` },
        { name: `${company.slug}-photos.zip`, kind: "photos", detail: `${photoCount} photos · ${Math.round(photoCount * (1.8 + rng()))} MB` },
        ...(colours.length > 0 ? [{ name: "brand-guide.pdf", kind: "document" as const, detail: `Brand guide · ${(0.6 + rng() * 2).toFixed(1)} MB` }] : []),
      ],
      colours,
      domain: custom
        ? { kind: "custom", host: custom, note: "The Owner already owns this domain and points it to Sanchara after review." }
        : { kind: "subdomain", host: `${company.slug}.${PLATFORM_DOMAIN}`, note: "Included in every plan." },
      properties: companyPropertyNames(company),
      ownerNotes: OWNER_NOTES[company.index % OWNER_NOTES.length],
      timeline: timeline(request.id, request.requestedAt, request.status, company, template.name, assignee, pages.length, rng),
      internalNotes: internalNotes(request.id, request.requestedAt, request.status, assignee, now, rng),
    };
  });

  cache = { now, requests };
  return requests;
}

function timeline(id: string, requestedAt: string, status: WebsiteRequestStatus, company: GeneratedCompany, templateName: string, assignee: WebsiteRequestAssignee | null, pageCount: number, rng: () => number): WebsiteRequestEvent[] {
  const start = Date.parse(requestedAt);
  const at = (hours: number) => new Date(start + hours * HOUR_MS).toISOString();
  const events: WebsiteRequestEvent[] = [{ id: `${id}_req`, at: requestedAt, kind: "requested", actor: company.ownerName, note: `${templateName} template · ${pageCount} pages` }];
  if (assignee) events.push({ id: `${id}_asg`, at: at(2 + rng() * 6), kind: "assigned", actor: ASSIGNED_BY, note: `Assigned to ${assignee.name}` });
  if (assignee && status !== "requested") events.push({ id: `${id}_bld`, at: at(10 + rng() * 14), kind: "build-started", actor: assignee.name, note: `${templateName} template` });
  if (assignee && status === "review") events.push({ id: `${id}_rev`, at: at(40 + rng() * 20), kind: "sent-for-review", actor: assignee.name, note: "Preview link emailed to the Owner" });
  return events.reverse();
}

function internalNotes(id: string, requestedAt: string, status: WebsiteRequestStatus, assignee: WebsiteRequestAssignee | null, now: number, rng: () => number): WebsiteRequestNote[] {
  if (!assignee || status === "requested") return [];
  const start = Date.parse(requestedAt);
  const count = status === "review" ? 2 : 1;
  const first = Math.floor(rng() * TEAM_NOTES.length);
  return Array.from({ length: count }, (_, i) => ({
    id: `${id}_note_${i}`,
    at: new Date(Math.min(start + (20 + i * 18 + rng() * 6) * HOUR_MS, now - HOUR_MS)).toISOString(),
    author: assignee.name,
    text: TEAM_NOTES[(first + i) % TEAM_NOTES.length],
  })).reverse();
}

export type WebsiteRequestList = {
  items: WebsiteRequestDetail[];
  total: number;
  counts: Record<WebsiteRequestStatus, number>;
  // Team members holding at least one request, for the Assignee filter.
  assignees: WebsiteRequestAssignee[];
};

export async function listWebsiteRequestRows(filters: WebsiteRequestFilters): Promise<WebsiteRequestList> {
  await connection();
  const all = await allWebsiteRequestDetails(Date.now());
  const q = filters.q.trim().toLowerCase();
  const items = all.filter((r) => {
    if (filters.status !== "all" && r.status !== filters.status) return false;
    if (filters.assignee === "unassigned" ? r.assignee !== null : filters.assignee && r.assignee?.id !== filters.assignee) return false;
    if (q && ![r.companyName, r.location, r.companyId, r.id, r.owner.name].some((v) => v.toLowerCase().includes(q))) return false;
    return true;
  });
  const count = (status: WebsiteRequestStatus) => all.filter((r) => r.status === status).length;
  const assignees = [...new Map(all.flatMap((r) => (r.assignee ? [[r.assignee.id, r.assignee] as const] : []))).values()].sort((a, b) => a.name.localeCompare(b.name));
  return { items, total: all.length, counts: { requested: count("requested"), "in-progress": count("in-progress"), review: count("review") }, assignees };
}

export async function getWebsiteRequest(id: string): Promise<WebsiteRequestDetail | null> {
  await connection();
  return (await allWebsiteRequestDetails(Date.now())).find((r) => r.id === id) ?? null;
}

// Active team members a request can be assigned to.
export async function listWebsiteRequestTeam(): Promise<WebsiteRequestAssignee[]> {
  await connection();
  return allAdmins(Date.now())
    .filter((a) => a.status === "active")
    .map((a) => ({ id: a.id, name: a.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
