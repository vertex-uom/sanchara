import {
  Ban,
  ChartNoAxesColumnIncreasing,
  Database,
  FileText,
  House,
  Megaphone,
  Settings,
  Shield,
  UserRoundCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

// Platform Admin navigation, defined once. The sidebar renders it and each
// page reads its title and description from it. Order matches the design;
// Privacy Requests, Listings & Content, Support and System Health are not
// part of v8 and are intentionally absent.
export type AdminNavKey =
  | "overview"
  | "onboarding"
  | "accounts"
  | "users"
  | "admin-users"
  | "finance"
  | "configuration"
  | "announcements"
  | "analytics"
  | "audit-logs";

export type AdminNavItem = {
  key: AdminNavKey;
  label: string;
  // Browser path on the admin host (proxy.ts adds the /admin prefix).
  href: string;
  icon: LucideIcon;
  // Page <h1> when it differs from the nav label (e.g. "Platform Overview").
  pageTitle?: string;
  // Short page description shown under the page title.
  description: string;
  // The design sets this one long label a point smaller so it fits on a line.
  compactLabel?: true;
};

export const ADMIN_NAV: readonly AdminNavItem[] = [
  {
    key: "overview",
    label: "Overview",
    href: "/",
    icon: House,
    pageTitle: "Platform Overview",
    description: "Monitor trends, track work, and keep what's happening across Sanchara today.",
  },
  {
    key: "onboarding",
    label: "Onboarding & Verification",
    href: "/onboarding",
    icon: UserRoundCheck,
    description: "Open companies, create the Owner's login and follow up until the Owner signs in.",
  },
  {
    key: "accounts",
    label: "Accounts & Enforcement",
    href: "/accounts",
    icon: Ban,
    description: "Company directory, suspensions and reactivations, website build requests.",
  },
  {
    key: "users",
    label: "Users",
    href: "/users",
    icon: UsersRound,
    description: "Staff accounts across all companies: owners, managers and front desk.",
  },
  {
    key: "admin-users",
    label: "Admin Users",
    href: "/admin-users",
    icon: Shield,
    description: "",
  },
  {
    key: "finance",
    label: "Financial Operations",
    href: "/finance",
    icon: Database,
    description: "Company subscriptions, plan billing and the platform exchange rate.",
  },
  {
    key: "configuration",
    label: "Platform Configuration",
    href: "/configuration",
    icon: Settings,
    description: "Plans, platform domains, website templates and the rules every company runs under.",
  },
  {
    key: "announcements",
    label: "Announcements",
    href: "/announcements",
    icon: Megaphone,
    description: "Messages from the platform team to company staff: a banner in Back Office, an email, or both.",
  },
  {
    key: "analytics",
    label: "Analytics",
    href: "/analytics",
    icon: ChartNoAxesColumnIncreasing,
    description: "How the platform is growing: companies, onboarding, subscriptions and retention.",
  },
  {
    key: "audit-logs",
    label: "Audit Logs",
    href: "/audit-logs",
    icon: FileText,
    description: "What the platform team did in this console: who, what, when and from where. Kept for 1 year.",
  },
] as const;

export function adminNavItem(key: AdminNavKey): AdminNavItem {
  const item = ADMIN_NAV.find((entry) => entry.key === key);
  if (!item) throw new Error(`Unknown admin nav key: ${key}`);
  return item;
}

// Overview is the root, so it matches only exactly; every other item also
// matches its sub-paths.
export function isAdminNavActive(pathname: string, item: AdminNavItem) {
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
