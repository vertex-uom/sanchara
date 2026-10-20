import type { Money } from "@/lib/format/money";

// Chip / status tones from the Figma status variables.
export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

export type OverviewKpiKey = "companies" | "properties" | "staff" | "subscriptions";

export type OverviewKpi = {
  key: OverviewKpiKey;
  // Either a count or a money amount (subscriptions show MRR).
  value: { count: number } | { money: Money };
  // Change against the previous month, as a ratio (0.056 → "+5.6%"). Null when
  // there is no comparison.
  deltaRatio: number | null;
  breakdown: { label: string; count: number }[];
};

export type WorkQueueKey = "applications" | "website-requests" | "flagged-content" | "past-due";

export type WorkQueue = {
  key: WorkQueueKey;
  count: number;
  // Short status, e.g. "12 overdue". Null when nothing needs flagging.
  flag: { label: string; tone: Tone } | null;
  note: string;
};

export type AdminActivityKind =
  | "company"
  | "subscription"
  | "exchange-rate"
  | "role"
  | "user"
  | "website"
  | "announcement"
  | "review";

export type AdminActivity = {
  id: string;
  kind: AdminActivityKind;
  title: string;
  detail: string;
  occurredAt: string;
  actor: string;
  critical?: true;
};

export type AnnouncementKind = "feature" | "maintenance" | "policy" | "reminder";

export type ActiveAnnouncement = {
  id: string;
  kind: AnnouncementKind;
  title: string;
  // Date, audience and channel, already joined by the API.
  meta: string;
};

export type CompanyStatus = "active" | "pending" | "suspended";

export type RecentCompany = {
  id: string;
  name: string;
  location: string;
  plan: string;
  status: CompanyStatus;
  joinedAt: string;
};

// ---------------------------------------------------------------------------
// Onboarding & Verification

// Open statuses come first; "approved" and "rejected" are final.
export type ApplicationStatus = "submitted" | "resubmitted" | "in-review" | "more-info" | "on-hold" | "approved" | "rejected";

export const OPEN_APPLICATION_STATUSES: readonly ApplicationStatus[] = ["submitted", "resubmitted", "in-review", "more-info", "on-hold"];

// Review SLA in days; an open application older than this is overdue unless
// the ball is in the applicant's court ("more-info") or it is on hold.
export const APPLICATION_SLA_DAYS = 3;

export type OwnerApplication = {
  id: string;
  // Human reference shown in the UI, e.g. "APP-2026-1182".
  reference: string;
  businessName: string;
  applicantName: string;
  region: string;
  businessType: string;
  status: ApplicationStatus;
  submittedAt: string;
};

export type DocumentStatus = "verified" | "pending" | "expired" | "rejected";

export type ApplicationDocument = {
  id: string;
  name: string;
  status: DocumentStatus;
  // One line under the name: "Valid to 11 Mar 2029", "Uploaded 21 Oct".
  detail: string;
};

// One row of the merged "Activity & messages" timeline. Events are system or
// reviewer actions; messages are the reviewer <-> applicant thread.
export type ApplicationTimelineEntry =
  | { id: string; kind: "event"; title: string; actor: string; occurredAt: string }
  | {
      id: string;
      kind: "message";
      author: string;
      authorRole: "reviewer" | "applicant";
      body: string;
      occurredAt: string;
    };

export type OwnerApplicationDetail = OwnerApplication & {
  legalName: string;
  registrationNo: string;
  taxId: string;
  address: string;
  contact: string;
  propertiesDeclared: string[];
  documents: ApplicationDocument[];
  // Latest reviewer-only note; never shown to the applicant.
  internalNote: string | null;
  timeline: ApplicationTimelineEntry[];
};

export type ApplicationKpiKey = "new" | "in-review" | "awaiting" | "decided";

export type ApplicationKpi = {
  key: ApplicationKpiKey;
  count: number;
  chip: { label: string; tone: Tone } | null;
  note: string;
};

export type ApplicationStatusFilter = "all" | "open" | ApplicationStatus;
export type ApplicationPeriod = "all" | "7d" | "30d" | "month";
export type ApplicationSort = "newest" | "oldest";

export type ApplicationFilters = {
  q: string;
  status: ApplicationStatusFilter;
  region: string; // "" = all
  type: string; // "" = all
  period: ApplicationPeriod;
  sort: ApplicationSort;
  page: number;
};

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
