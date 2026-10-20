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

// ---------------------------------------------------------------------------
// Accounts & Enforcement

// The company status machine from the architecture: suspensions are either
// by an administrator or automatic for non-payment (lifted by payment).
// "pending" = approved application whose owner has not finished setup.
export type CompanyAccountStatus = "active" | "pending" | "suspended-admin" | "suspended-nonpayment";

export type SubscriptionState = "paid" | "past-due" | "suspended" | "none";

export type CompanyPlan = "Starter" | "Standard" | "Pro";

export type CompanyAccount = {
  id: string;
  name: string;
  location: string;
  plan: CompanyPlan;
  propertyCount: number;
  staffCount: number;
  status: CompanyAccountStatus;
  joinedAt: string;
};

export type CompanyAccountDetail = CompanyAccount & {
  legalName: string;
  registrationNo: string;
  ownerName: string;
  contact: string;
  // Hosts the API has registered for the company (subdomain and custom domains).
  siteHosts: string[];
  subscription: { state: SubscriptionState; detail: string };
  properties: string[];
  staff: { owners: number; managers: number; frontDesk: number };
  // Open website-build request, if any.
  websiteRequestId: string | null;
  history: EnforcementEntry[];
};

export type EnforcementKind = "suspended" | "reactivated" | "suspended-nonpayment" | "reactivated-payment" | "warning";

export type EnforcementEntry = {
  id: string;
  companyId: string;
  companyName: string;
  kind: EnforcementKind;
  // Reason category plus free text, already joined.
  reason: string;
  actor: string;
  occurredAt: string;
  critical?: true;
};

export type WebsiteRequestStatus = "requested" | "in-progress" | "review";

export type WebsiteRequest = {
  id: string;
  companyId: string;
  companyName: string;
  location: string;
  requestedAt: string;
  dueAt: string;
  status: WebsiteRequestStatus;
};

export type AccountKpiKey = "companies" | "active" | "suspended" | "website-requests";

export type AccountKpi = {
  key: AccountKpiKey;
  count: number;
  chip: { label: string; tone: Tone } | null;
  note: string;
};

export type CompanyStatusFilter = "all" | CompanyAccountStatus | "suspended";

export type CompanyFilters = {
  q: string;
  status: CompanyStatusFilter;
  plan: "" | CompanyPlan;
  region: string; // "" = all
  period: ApplicationPeriod;
  sort: "newest" | "oldest" | "name";
  page: number;
};

// ---------------------------------------------------------------------------
// Users (staff accounts across companies; never guests)

export type StaffRole = "owner" | "manager" | "front-desk";

// invited = account created by the company, not yet activated.
// locked = too many failed sign-ins; unlocked by the platform team.
export type StaffStatus = "active" | "invited" | "locked";

export type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: StaffStatus;
  companyId: string;
  companyName: string;
  companyStatus: CompanyAccountStatus;
  // null while the invite is pending.
  lastActiveAt: string | null;
  createdAt: string;
};

export type SignInMethod = "password" | "google";

export type StaffUserDetail = StaffUser & {
  phone: string | null;
  signInMethod: SignInMethod;
  // Properties the account works on (owners and managers: all of them).
  properties: string[];
  invitedBy: string;
  activatedAt: string | null;
  security: {
    lastLogin: { at: string; client: string; location: string } | null;
    activeSessions: number;
    failedLogins24h: number;
    lockedAt: string | null;
  };
};

export type StaffActivityPeriod = "any" | "24h" | "7d" | "30d" | "inactive";

export type StaffFilters = {
  q: string;
  role: "all" | StaffRole;
  status: "all" | StaffStatus;
  company: string; // company id, "" = all
  activity: StaffActivityPeriod;
  sort: "recent" | "name" | "newest";
  page: number;
};

// ---------------------------------------------------------------------------
// Admin Users (WEMIXT platform-team accounts; one role: Platform Admin)

export type AdminAccountStatus = "active" | "invited" | "deactivated";

export type AdminAccount = {
  id: string;
  name: string;
  email: string;
  status: AdminAccountStatus;
  // Two-step verification is mandatory; it is enrolled on first sign-in.
  twoStep: "on" | "pending";
  lastSignInAt: string | null;
  addedAt: string;
  addedBy: string;
};

export type AdminAccountChangeKind = "invited" | "activated" | "deactivated" | "reactivated";

export type AdminAccountChange = {
  id: string;
  kind: AdminAccountChangeKind;
  adminName: string;
  actor: string;
  occurredAt: string;
};
