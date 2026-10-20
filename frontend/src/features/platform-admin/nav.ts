import {
  Ban,
  ChartNoAxesColumnIncreasing,
  Database,
  FileText,
  House,
  Megaphone,
  Settings,
  Shield,
  Star,
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
  | "reviews"
  | "help"
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
    description: "Review owner applications, verify documents and re-verify existing owners.",
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
    description: "Who can open this console. All platform admins share one role.",
  },
  {
    key: "finance",
    label: "Financial Operations",
    href: "/finance",
    icon: Database,
    description: "Subscriptions, plans and the platform exchange rate.",
  },
  {
    key: "configuration",
    label: "Platform Configuration",
    href: "/configuration",
    icon: Settings,
    description: "Platform-level settings.",
  },
  {
    key: "reviews",
    label: "Reviews & Reported Content",
    href: "/reviews",
    icon: Star,
    description: "Moderate reviews and reported content.",
  },
  {
    key: "help",
    label: "Help Content & Announcements",
    href: "/help",
    icon: Megaphone,
    description: "Help articles and announcements shown to companies.",
    compactLabel: true,
  },
  {
    key: "analytics",
    label: "Analytics",
    href: "/analytics",
    icon: ChartNoAxesColumnIncreasing,
    description: "Platform analytics.",
  },
  {
    key: "audit-logs",
    label: "Audit Logs",
    href: "/audit-logs",
    icon: FileText,
    description: "Who changed what and when across the platform.",
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
