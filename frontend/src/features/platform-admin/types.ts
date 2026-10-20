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

export type WorkQueueKey = "awaiting-owners" | "website-requests";

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
  | "announcement";

export type AdminActivity = {
  id: string;
  kind: AdminActivityKind;
  title: string;
  detail: string;
  occurredAt: string;
  actor: string;
  critical?: true;
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
// Onboarding & Verification: the platform team creates a company, its first
// property and the Owner's login. The Owner gets the owner-portal link and a
// temporary password by email (never shared with other staff) and must change
// the password on first sign-in. Credentials expire after 72 hours.

export const OWNER_CREDENTIALS_VALID_HOURS = 72;

// Period filter shared with Accounts ("Joined").
export type JoinedPeriod = "all" | "7d" | "30d" | "month";

export type CompanyDraft = {
  company: { name: string; subdomain: string; location: string; plan: CompanyPlan };
  property: { name: string; type: string; address: string };
  owner: { name: string; email: string; phone: string };
};

// Shown once after creation; the API would return this from the create call.
export type OwnerCredentials = {
  companyId: string;
  companyName: string;
  subdomain: string;
  ownerName: string;
  ownerEmail: string;
  temporaryPassword: string;
  ownerPortalLink: string;
  issuedAt: string;
  expiresAt: string;
};

export type OnboardingStatus = "awaiting-sign-in" | "expired";

// A company whose Owner has not signed in yet.
export type OnboardingItem = {
  companyId: string;
  companyName: string;
  subdomain: string;
  location: string;
  plan: CompanyPlan;
  ownerName: string;
  ownerEmail: string;
  createdBy: string;
  createdAt: string;
  // When the current credentials were issued (creation or last regeneration).
  credentialsIssuedAt: string;
  credentialsExpireAt: string;
  status: OnboardingStatus;
};

export type OnboardingKpiKey = "awaiting" | "expired" | "created" | "setup";

export type OnboardingKpi = {
  key: OnboardingKpiKey;
  count: number;
  chip: { label: string; tone: Tone } | null;
  note: string;
};

export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

// ---------------------------------------------------------------------------
// Accounts & Enforcement

// The company status machine: suspensions are either by an administrator or
// automatic for non-payment. A failed renewal blocks access the same day (no
// grace period); payment within one year restores it. After a year unpaid the
// company is "closed" and its data deleted. "pending" = created by the platform
// team; the Owner has not finished setup (or not signed in yet).
export type CompanyAccountStatus = "active" | "pending" | "suspended-admin" | "suspended-nonpayment" | "closed";

export type SubscriptionState = "paid" | "suspended" | "closed" | "none";

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

export type EnforcementKind = "suspended" | "reactivated" | "suspended-nonpayment" | "reactivated-payment" | "closed" | "warning";

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
  period: JoinedPeriod;
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

// ---------------------------------------------------------------------------
// Financial Operations: company subscriptions and the platform exchange rate.
// Everything here comes from the `subscriptions` module (plan, billing state,
// charge outcomes it received as events). Platform Admin never reads guest
// payments, refunds or reservations.

// `suspended`: a renewal failed and access was blocked the same day; paying
// restores it. `closed`: unpaid for a year, data deleted. `not-started`: the
// company has not finished setup, so billing has not begun.
export type SubscriptionStatus = "paid" | "suspended" | "closed" | "not-started";

export type CompanySubscription = {
  // Same id as the company; one subscription per company.
  id: string;
  companyName: string;
  location: string;
  plan: CompanyPlan;
  price: Money;
  status: SubscriptionStatus;
  // Date-only. Paid: next charge. Suspended / closed: the renewal that
  // failed. Not started: null.
  dueAt: string | null;
  // Suspended only: the day the company's data is deleted unless it pays
  // (one year after the suspension).
  dataKeptUntil: string | null;
};

export type SubscriptionInvoiceStatus = "paid" | "failed";

export type SubscriptionInvoice = {
  id: string;
  number: string;
  // Billing month, date-only.
  periodStart: string;
  periodEnd: string;
  amount: Money;
  status: SubscriptionInvoiceStatus;
  issuedAt: string;
  paidAt: string | null;
};

export type CompanySubscriptionDetail = CompanySubscription & {
  companyStatus: CompanyAccountStatus;
  // Date-only; billing started the day the company went active.
  startedAt: string | null;
  // Day of the month the subscription renews (1–28).
  billingDay: number | null;
  suspendedAt: string | null;
  closedAt: string | null;
  // Newest first. Empty once the company is closed (deleted with its data).
  invoices: SubscriptionInvoice[];
};

export type SubscriptionDue = "any" | "7d" | "30d";

export type SubscriptionFilters = {
  q: string;
  plan: "" | CompanyPlan;
  status: "all" | SubscriptionStatus;
  due: SubscriptionDue;
  sort: "due" | "name" | "amount";
  page: number;
};

export type ExchangeRate = {
  id: string;
  // LKR per 1 USD, as stored (two decimals).
  usdToLkr: number;
  // The rate this one replaced; null for the first entry.
  previous: number | null;
  setAt: string;
  setBy: string;
  note: string | null;
};

// ---------------------------------------------------------------------------
// Platform Configuration: plans (subscriptions), domains and website
// templates. Prices, limits and reports per plan are open in the
// architecture, so the apps render whatever the API returns here.

export type PlanDefinition = {
  id: CompanyPlan;
  name: CompanyPlan;
  tagline: string;
  monthlyPrice: Money;
  // null = no limit.
  limits: { properties: number | null; units: number | null; staffAccounts: number | null };
  reports: string[];
  // Companies currently on the plan (every status except closed).
  companies: number;
};

export type ReservedSubdomain = {
  name: string;
  // What the host is used for, e.g. "Admin console".
  purpose: string;
};

export type CustomDomainStatus = "verified" | "pending" | "failed";

export type CustomDomain = {
  id: string;
  companyId: string;
  companyName: string;
  hostname: string;
  status: CustomDomainStatus;
  requestedAt: string;
  // Last automatic DNS check.
  checkedAt: string;
  // Why the last check failed, if it did.
  issue: string | null;
};

export type DomainSettings = {
  // Company sites live at {subdomain}.{platformDomain}.
  platformDomain: string;
  centralHost: string;
  backOfficeHost: string;
  adminHost: string;
  reserved: ReservedSubdomain[];
  // How often custom domains are re-checked, in minutes.
  checkIntervalMinutes: number;
};

export type WebsiteTemplate = {
  id: string;
  name: string;
  description: string;
  // Property kinds the template was designed for.
  suitedTo: string;
  pages: string[];
  // Companies whose site uses the template.
  companies: number;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Announcements

// Platform-wide messages from the WEMIXT team to company staff: shown as a
// banner in Back Office, sent by email through `messaging`, or both. There is
// no help centre, no push channel and no region targeting (one platform
// domain). Status is derived from the window: scheduled before `startsAt`,
// active until `endsAt`, archived afterwards or when archived by hand.
export type AnnouncementType = "feature" | "maintenance" | "policy" | "reminder" | "urgent";
export type AnnouncementAudience = "all-staff" | "owners" | "managers" | "front-desk";
export type AnnouncementChannel = "in-app" | "email";
export type AnnouncementStatus = "active" | "scheduled" | "archived";

export type Announcement = {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  audience: AnnouncementAudience;
  channels: AnnouncementChannel[];
  status: AnnouncementStatus;
  startsAt: string;
  // Null = stays up until archived by hand.
  endsAt: string | null;
  // Staff can close the in-app banner.
  dismissible: boolean;
  createdBy: string;
  createdAt: string;
  // Set when an admin archived it early; otherwise it expired at `endsAt`.
  archivedAt: string | null;
};

// ---------------------------------------------------------------------------
// Analytics

// Platform-growth metrics only: companies, onboarding, subscriptions and
// retention, all derived from modules Platform Admin may read. Nothing here
// comes from bookings, guests or payments (no GMV, occupancy, ADR, funnels
// of guest searches, disputes or review scores).
export type AnalyticsPeriod = "30d" | "90d" | "12m";
export type AnalyticsMetric = "companies" | "mrr";

export type AnalyticsFilters = {
  period: AnalyticsPeriod;
  plan: "" | CompanyPlan;
  // Which series the trend chart draws.
  metric: AnalyticsMetric;
};

export type AnalyticsKpiKey = "active" | "new" | "mrr" | "blocked";

export type AnalyticsKpi = {
  key: AnalyticsKpiKey;
  value: { count: number } | { money: Money };
  // Change against the previous period of the same length, as a ratio; null
  // when the previous period had nothing to compare with.
  deltaRatio: number | null;
  note: string;
};

export type TrendPoint = {
  // "2026-05"
  month: string;
  // "May"
  label: string;
  companies: number;
  mrr: Money;
};

export type FunnelStepKey = "created" | "signed-in" | "setup" | "paid";

export type FunnelStep = {
  key: FunnelStepKey;
  label: string;
  count: number;
  // Share of the previous step; null for the first.
  rate: number | null;
};

export type PlanBreakdown = {
  plan: CompanyPlan;
  companies: number;
  mrr: Money;
  // Share of total MRR.
  share: number;
  avgProperties: number;
  avgStaff: number;
};

export type RetentionCohort = {
  // "2026-05"
  month: string;
  label: string;
  // Companies that joined in the month.
  size: number;
  // Share still active at the end of month M0…M5; null for months not yet reached.
  retention: (number | null)[];
};

// ---------------------------------------------------------------------------
// Audit Logs: what the platform team did in this console. The company-level
// audit trail (rates, reservations, payments, staff) is owner-only and is
// never shown here. Entries are kept for one year.

export type AuditCategory = "companies" | "admin-users" | "finance" | "configuration" | "announcements" | "websites" | "sign-ins";

export type AuditDateRange = "today" | "7d" | "30d" | "all";

export type AuditFilters = {
  q: string;
  // Actor id; "" = everyone. "system" = automatic actions.
  actor: string;
  category: "" | AuditCategory;
  range: AuditDateRange;
  critical: boolean;
  page: number;
};

export type AuditTargetKind = "company" | "admin-user" | "announcement" | "exchange-rate" | "plan" | "template";

export type AuditTarget = {
  kind: AuditTargetKind;
  id: string;
  label: string;
  // Console path, when the target has a page.
  href: string | null;
};

export type AuditChange = { field: string; before: string | null; after: string | null };

export type AuditEvent = {
  id: string;
  at: string;
  action: string;
  category: AuditCategory;
  critical: boolean;
  // Only sign-ins can fail.
  failed: boolean;
  // "System" for automatic actions (non-payment blocks, closures).
  actor: { id: string; name: string; email: string | null };
  target: AuditTarget | null;
  ip: string | null;
  changes: AuditChange[];
  note: string | null;
};
