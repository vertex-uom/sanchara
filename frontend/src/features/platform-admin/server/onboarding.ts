import { connection } from "next/server";
import {
  APPLICATION_SLA_DAYS,
  OPEN_APPLICATION_STATUSES,
  type ApplicationDocument,
  type ApplicationFilters,
  type ApplicationKpi,
  type ApplicationStatus,
  type ApplicationTimelineEntry,
  type OwnerApplication,
  type OwnerApplicationDetail,
  type Paged,
} from "../types";

// TEMPORARY fixtures for Onboarding & Verification. Replace each exported
// function's body with the platform-admin API call once it exists; the
// signatures and return types stay the same. Nothing here touches bookings,
// guests, enquiries or payments.
//
// Submission times are relative to "now" so the ages, the overdue count and
// the KPIs stay consistent with the Overview (23 open · 6 overdue) whatever
// the date. Reading the clock makes these request-time functions, so each one
// awaits connection() first (the API calls that replace them will be too).

export const APPLICATION_PAGE_SIZE = 8;

const DAY_MS = 24 * 60 * 60 * 1000;

type Seed = [reference: string, business: string, applicant: string, region: string, type: string, status: ApplicationStatus, ageDays: number];

// prettier-ignore
const SEEDS: Seed[] = [
  // submitted (7) — one overdue
  ["APP-2026-1182", "Sundara Villa Holdings",   "Emily Carter",          "Galle",         "Villa",          "submitted",   0.2],
  ["APP-2026-1181", "Palm Breeze Resort",       "Sahana Kumari",         "Matara",        "Resort",         "submitted",   0.5],
  ["APP-2026-1180", "Sea View Rooms",           "Nimal Fernando",        "Unawatuna",     "Guest House",    "submitted",   1.0],
  ["APP-2026-1179", "Hill Country Escape",      "Dilani Silva",          "Kandy",         "Villa",          "submitted",   1.5],
  ["APP-2026-1178", "Negombo Lagoon Stay",      "Ruwan Jayasuriya",      "Negombo",       "Homestay",       "submitted",   2.0],
  ["APP-2026-1177", "Arugam Surf Lodge",        "Tharindu Perera",       "Arugam Bay",    "Guest House",    "submitted",   2.5],
  ["APP-2026-1176", "Kalpitiya Kite Cabins",    "Ishara Wickramasinghe", "Kalpitiya",     "Cottage",        "submitted",   4.0],
  // resubmitted (2) — one overdue
  ["APP-2026-1170", "Lagoon View Resort",       "Pradeep Mendis",        "Galle",         "Resort",         "resubmitted", 1.0],
  ["APP-2026-1165", "Cinnamon Hill Homestay",   "Sanduni Rathnayake",    "Matale",        "Homestay",       "resubmitted", 5.0],
  // in review (8) — four overdue
  ["APP-2026-1175", "Ocean Breeze Guest House", "Kasun Perera",          "Mirissa",       "Guest House",    "in-review",   1.0],
  ["APP-2026-1174", "Tea Hill Cottage",         "Buddhi Mendis",         "Nuwara Eliya",  "Cottage",        "in-review",   2.0],
  ["APP-2026-1173", "Midigama Point Rooms",     "Chamari Gunasekara",    "Midigama",      "Guest House",    "in-review",   2.5],
  ["APP-2026-1172", "Ella Gap Cabins",          "Lakmal Bandara",        "Ella",          "Cottage",        "in-review",   2.8],
  ["APP-2026-1169", "Trinco Blue Villa",        "Fathima Rizwan",        "Trincomalee",   "Villa",          "in-review",   4.0],
  ["APP-2026-1168", "Weligama Bay Boutique",    "Harsha de Silva",       "Weligama",      "Boutique Hotel", "in-review",   5.0],
  ["APP-2026-1167", "Sigiriya Rock Lodge",      "Nadeesha Herath",       "Sigiriya",      "Guest House",    "in-review",   6.0],
  ["APP-2026-1164", "Colombo Cityview Suites",  "Anjali Fonseka",        "Colombo",       "Boutique Hotel", "in-review",   8.0],
  // awaiting applicant (4)
  ["APP-2026-1171", "Forest Edge Villa",        "Rashmi Weerasinghe",    "Ella",          "Villa",          "more-info",   3.0],
  ["APP-2026-1166", "Hikkaduwa Coral Rooms",    "Dinesh Kumar",          "Hikkaduwa",     "Guest House",    "more-info",   4.0],
  ["APP-2026-1163", "Jaffna Heritage House",    "Priya Selvarajah",      "Jaffna",        "Homestay",       "more-info",   6.0],
  ["APP-2026-1162", "Bentota River Retreat",    "Malith Abeysekera",     "Bentota",       "Villa",          "more-info",   7.0],
  // on hold (2)
  ["APP-2026-1161", "Knuckles Eco Camp",        "Sampath Dissanayake",   "Kandy",         "Cottage",        "on-hold",     5.0],
  ["APP-2026-1158", "Pasikuda Bay Resort",      "Mohamed Nazeer",        "Pasikuda",      "Resort",         "on-hold",     9.0],
  // approved (4)
  ["APP-2026-1160", "Mount Lavinia Beach House","Shanika Peiris",        "Colombo",       "Guest House",    "approved",    6.0],
  ["APP-2026-1157", "Dambulla Garden Villa",    "Chathura Senanayake",   "Dambulla",      "Villa",          "approved",    8.0],
  ["APP-2026-1155", "Tangalle Dune Cabanas",    "Nirosha Fernando",      "Tangalle",      "Cottage",        "approved",   10.0],
  ["APP-2026-1153", "Haputale Misty Lodge",     "Roshan Wijesinghe",     "Haputale",      "Guest House",    "approved",   12.0],
  // rejected (3)
  ["APP-2026-1159", "Unawatuna Surf Rooms",     "Dulan Jayawardena",     "Unawatuna",     "Guest House",    "rejected",    7.0],
  ["APP-2026-1156", "Galle Fort Residence",     "Kavindu Rajapaksa",     "Galle",         "Boutique Hotel", "rejected",    9.0],
  ["APP-2026-1154", "Yala Safari Camp",         "Suresh Kumara",         "Tissamaharama", "Cottage",        "rejected",   11.0],
];

const REVIEWER = "Kamala Silva";

function applications(now: number): OwnerApplication[] {
  return SEEDS.map(([reference, businessName, applicantName, region, businessType, status, ageDays]) => ({
    id: reference.toLowerCase(),
    reference,
    businessName,
    applicantName,
    region,
    businessType,
    status,
    submittedAt: new Date(now - ageDays * DAY_MS).toISOString(),
  }));
}

export function isOpenApplication(status: ApplicationStatus) {
  return OPEN_APPLICATION_STATUSES.includes(status);
}

export function applicationAgeDays(application: Pick<OwnerApplication, "submittedAt">, now: Date) {
  return (now.getTime() - new Date(application.submittedAt).getTime()) / DAY_MS;
}

// Overdue = still waiting on us (not on the applicant, not on hold) past the SLA.
export function isOverdueApplication(application: Pick<OwnerApplication, "status" | "submittedAt">, now: Date) {
  const waitingOnUs = application.status === "submitted" || application.status === "resubmitted" || application.status === "in-review";
  return waitingOnUs && applicationAgeDays(application, now) > APPLICATION_SLA_DAYS;
}

export async function getApplicationKpis(): Promise<ApplicationKpi[]> {
  await connection();
  const now = new Date();
  const all = applications(now.getTime());
  const count = (...statuses: ApplicationStatus[]) => all.filter((a) => statuses.includes(a.status)).length;

  const submitted = count("submitted");
  const resubmitted = count("resubmitted");
  const inReview = count("in-review");
  const onHold = count("on-hold");
  const overdue = all.filter((a) => isOverdueApplication(a, now)).length;
  const reviewing = all.filter((a) => a.status === "in-review");
  const avgAge = reviewing.reduce((sum, a) => sum + applicationAgeDays(a, now), 0) / Math.max(reviewing.length, 1);
  const approved = count("approved");
  const rejected = count("rejected");
  const approvalRate = Math.round((approved / Math.max(approved + rejected, 1)) * 100);

  return [
    {
      key: "new",
      count: submitted + resubmitted,
      chip: { label: `+${all.filter((a) => isOpenApplication(a.status) && applicationAgeDays(a, now) < 1).length} today`, tone: "success" },
      note: `${submitted} submitted · ${resubmitted} resubmitted`,
    },
    {
      key: "in-review",
      count: inReview + onHold,
      chip: overdue > 0 ? { label: `${overdue} overdue`, tone: "danger" } : null,
      note: `Avg. age ${avgAge.toFixed(1)} days · SLA ${APPLICATION_SLA_DAYS} days · ${onHold} on hold`,
    },
    {
      key: "awaiting",
      count: count("more-info"),
      chip: { label: "Awaiting", tone: "warning" },
      note: "Avg. applicant response 1.6 days",
    },
    {
      key: "decided",
      count: approved + rejected,
      chip: { label: `${approvalRate}% approved`, tone: approvalRate >= 50 ? "success" : "warning" },
      note: `${approved} approved · ${rejected} rejected this month`,
    },
  ];
}

// Distinct regions and business types for the filter selects.
export async function getApplicationFilterOptions(): Promise<{ regions: string[]; types: string[] }> {
  await connection();
  const all = applications(Date.now());
  const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));
  return { regions: unique(all.map((a) => a.region)), types: unique(all.map((a) => a.businessType)) };
}

function periodStart(period: ApplicationFilters["period"], now: Date) {
  switch (period) {
    case "7d":
      return now.getTime() - 7 * DAY_MS;
    case "30d":
      return now.getTime() - 30 * DAY_MS;
    case "month": {
      // First day of the current month in Sri Lanka time.
      const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit" }).format(now);
      return new Date(`${parts}-01T00:00:00+05:30`).getTime();
    }
    default:
      return 0;
  }
}

export async function listApplications(filters: ApplicationFilters): Promise<Paged<OwnerApplication>> {
  await connection();
  const now = new Date();
  const q = filters.q.trim().toLowerCase();
  const since = periodStart(filters.period, now);

  const matches = applications(now.getTime()).filter((a) => {
    if (filters.status === "open" ? !isOpenApplication(a.status) : filters.status !== "all" && a.status !== filters.status) return false;
    if (filters.region && a.region !== filters.region) return false;
    if (filters.type && a.businessType !== filters.type) return false;
    if (new Date(a.submittedAt).getTime() < since) return false;
    if (q && ![a.businessName, a.applicantName, a.reference].some((v) => v.toLowerCase().includes(q))) return false;
    return true;
  });

  matches.sort((a, b) => {
    const diff = new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    return filters.sort === "newest" ? diff : -diff;
  });

  const page = Math.min(Math.max(filters.page, 1), Math.max(Math.ceil(matches.length / APPLICATION_PAGE_SIZE), 1));
  const start = (page - 1) * APPLICATION_PAGE_SIZE;
  return { items: matches.slice(start, start + APPLICATION_PAGE_SIZE), total: matches.length, page, pageSize: APPLICATION_PAGE_SIZE };
}

// The application "Review next" opens: the most overdue one, else the oldest
// still waiting on us. Null when the queue is clear.
export async function getNextApplicationToReview(): Promise<OwnerApplication | null> {
  await connection();
  const now = new Date();
  const waiting = applications(now.getTime())
    .filter((a) => a.status === "submitted" || a.status === "resubmitted" || a.status === "in-review")
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
  return waiting[0] ?? null;
}

export async function getApplication(id: string): Promise<OwnerApplicationDetail | null> {
  await connection();
  const now = Date.now();
  const index = SEEDS.findIndex(([reference]) => reference.toLowerCase() === id.toLowerCase());
  if (index === -1) return null;
  const base = applications(now)[index];
  return { ...base, ...details(base, index, now) };
}

// --- Detail fixtures -------------------------------------------------------

function details(a: OwnerApplication, index: number, now: number): Omit<OwnerApplicationDetail, keyof OwnerApplication> {
  const n = 123456 + index * 137;
  const submitted = new Date(a.submittedAt).getTime();
  const at = (hoursAfterSubmit: number) => new Date(Math.min(submitted + hoursAfterSubmit * 3_600_000, now)).toISOString();

  return {
    legalName: `${a.businessName} (Pvt) Ltd`,
    registrationNo: `PV ${n}`,
    taxId: `TAX-${987654 - index * 91}`,
    address: `${18 + index * 7} ${a.region} Road, ${a.region}`,
    contact: `+94 7${index % 2 === 0 ? "7" : "1"} ${String(100 + index).padStart(3, "0")} ${String(4000 + index * 53).slice(-4)}`,
    propertiesDeclared: index % 3 === 0 ? [a.businessName, `${a.businessName} Annex`] : [a.businessName],
    documents: documents(a.status, index),
    internalNote: internalNote(a.status),
    timeline: timeline(a, at),
  };
}

function documents(status: ApplicationStatus, index: number): ApplicationDocument[] {
  const pending = (name: string): ApplicationDocument => ({ id: slug(name), name, status: "pending", detail: "Uploaded with the application" });
  const verified = (name: string, detail: string): ApplicationDocument => ({ id: slug(name), name, status: "verified", detail });

  const base: ApplicationDocument[] = [
    verified("Business registration", "Valid to 11 Mar 2029"),
    verified("Tax certificate", "Valid to 31 Dec 2026"),
    pending("Ownership / lease proof"),
    verified("Owner ID (NIC)", "Matched to applicant"),
    { id: "tourism-license", name: "Tourism license", status: "expired", detail: "Expired 30 Sep 2026" },
    pending("Bank proof"),
  ];

  switch (status) {
    case "submitted":
      return base.map((d) => pending(d.name));
    case "approved":
      return base.map((d) => (d.status === "verified" ? d : verified(d.name, "Verified by reviewer")));
    case "rejected":
      return base.map((d, i) => (i === 2 ? { ...d, status: "rejected", detail: "Does not match the declared property" } : d));
    case "resubmitted":
      return base.map((d, i) => (i === 4 ? { ...d, status: "pending", detail: "Renewed copy uploaded" } : d));
    default:
      // Vary which document is still outstanding so the list does not look cloned.
      return base.map((d, i) => (i === index % 6 && d.status === "verified" ? pending(d.name) : d));
  }
}

function internalNote(status: ApplicationStatus): string | null {
  switch (status) {
    case "more-info":
      return "Tourism license expired — request a renewed copy before approval.";
    case "on-hold":
      return "On hold until the registrar confirms the company registration number.";
    case "in-review":
      return "Ownership proof still outstanding; the rest checks out.";
    default:
      return null;
  }
}

function timeline(a: OwnerApplication, at: (hours: number) => string): ApplicationTimelineEntry[] {
  const entries: ApplicationTimelineEntry[] = [
    { id: "submitted", kind: "event", title: a.status === "resubmitted" ? "Application resubmitted" : "Application submitted", actor: a.applicantName, occurredAt: at(0) },
    { id: "documents", kind: "event", title: "6 documents received", actor: "System", occurredAt: at(0.02) },
  ];

  if (a.status === "submitted" || a.status === "resubmitted") return entries;

  entries.push({ id: "review-started", kind: "event", title: "Review started", actor: REVIEWER, occurredAt: at(5) });

  if (a.status === "in-review") return entries;

  if (a.status === "more-info" || a.status === "on-hold") {
    entries.push(
      { id: "more-info", kind: "event", title: "More info requested", actor: REVIEWER, occurredAt: at(6) },
      {
        id: "msg-1",
        kind: "message",
        author: `${REVIEWER} (Reviewer)`,
        authorRole: "reviewer",
        body: `Hi ${a.applicantName.split(" ")[0]}, your tourism license on file expired on 30 Sep 2026. Please upload the renewed license to continue.`,
        occurredAt: at(6.05),
      },
      {
        id: "msg-2",
        kind: "message",
        author: `${a.applicantName} (Applicant)`,
        authorRole: "applicant",
        body: "Thanks — renewal is in progress. I will upload the new certificate by Friday.",
        occurredAt: at(22),
      },
    );
    if (a.status === "on-hold") {
      entries.push({ id: "hold", kind: "event", title: "Put on hold — awaiting registrar confirmation", actor: REVIEWER, occurredAt: at(30) });
    } else {
      entries.push({ id: "upload", kind: "event", title: "Document uploaded: Bank proof", actor: a.applicantName, occurredAt: at(46) });
    }
    return entries;
  }

  entries.push(
    a.status === "approved"
      ? { id: "decision", kind: "event", title: "Application approved — company opened", actor: REVIEWER, occurredAt: at(52) }
      : { id: "decision", kind: "event", title: "Application rejected — ownership proof does not match", actor: REVIEWER, occurredAt: at(52) },
  );
  return entries;
}

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
