"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  CalendarDays,
  CalendarRange,
  ChartNoAxesColumn,
  CreditCard,
  Crown,
  Diamond,
  House,
  Monitor,
  Package,
  ScrollText,
  Settings,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import { can, type Capability } from "@/lib/auth/permissions";
import type { StaffRole } from "@/lib/auth/staff";
import { COMPANY_PATHS, propertyPath } from "@/lib/routes/backoffice";
import { cn } from "@/lib/utils";

// The sidebar is a "group/sidebar" with data-mode = auto | rail | full.
// auto: icon rail from md, full labels from lg. The drawer is always full.
export const FULL_ONLY = "hidden lg:flex group-data-[mode=rail]/sidebar:hidden group-data-[mode=full]/sidebar:flex";
const LABEL = "sr-only lg:not-sr-only group-data-[mode=rail]/sidebar:sr-only group-data-[mode=full]/sidebar:not-sr-only";

// activeFor: other pages that keep this item highlighted.
// capability: shown only to roles that have it; items without one are shown to everyone.
type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  activeFor?: string[];
  exact?: boolean;
  capability?: Capability;
};

// Every item for the Owner; other roles see the items their capabilities allow.
function buildNav(propertyId: string): NavItem[] {
  const p = (subPath = "") => propertyPath(propertyId, subPath);
  return [
    { key: "overview", label: "Overview", icon: House, href: p(), exact: true },
    { key: "calendar", label: "Reservations Calendar", icon: CalendarDays, href: p("calendar") },
    { key: "availability", label: "Availability & Date Blocks", icon: CalendarRange, href: p("availability") },
    {
      key: "rooms",
      label: "Rooms & Units",
      icon: BedDouble,
      href: p("config/room-types"),
      activeFor: [p("config/units")],
    },
    {
      key: "rates",
      label: "Rates & Seasons",
      icon: Diamond,
      href: p("rates"),
      activeFor: [p("config/rate-plans"), p("config/rate-cards"), p("config/seasons")],
      capability: "rates.manage",
    },
    { key: "packages", label: "Packages", icon: Package, href: p("packages"), capability: "packages.manage" },
    { key: "payments", label: "Payments & Refunds", icon: CreditCard, href: p("payments") },
    { key: "reports", label: "Reports", icon: ChartNoAxesColumn, href: p("reports"), capability: "reports.read" },
    { key: "reviews", label: "Reviews", icon: Star, href: p("reviews") },
    {
      key: "website",
      label: "Website Builder",
      icon: Monitor,
      href: COMPANY_PATHS.website,
      capability: "website.manage",
    },
    { key: "staff", label: "Staff Management", icon: Users, href: COMPANY_PATHS.staff, capability: "staff.read" },
    {
      key: "subscription",
      label: "Subscription & Plan",
      icon: Crown,
      href: COMPANY_PATHS.subscription,
      capability: "subscription.read",
    },
    { key: "audit", label: "Audit Trail", icon: ScrollText, href: COMPANY_PATHS.audit, capability: "audit.read" },
    {
      key: "settings",
      label: "Property Settings",
      icon: Settings,
      href: p("settings"),
      activeFor: [p("config/policies"), p("config/restrictions")],
      capability: "settings.read",
    },
  ];
}

function matches(pathname: string, href: string, exact = false) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function isActive(pathname: string, item: NavItem) {
  return [item.href, ...(item.activeFor ?? [])].some((href) => matches(pathname, href, item.exact));
}

// Short screens (laptops at 768px) get tighter rows so the whole menu fits.
const itemClass =
  "focus-ring min-h-11 w-full [@media(max-height:50rem)]:min-h-9 items-center gap-3.5 rounded-xl px-3 text-[0.9375rem] text-foreground transition-colors hover:bg-office-nav-active motion-reduce:transition-none";
// Design p.7: a soft white-to-teal pill with a light ring and shadow.
const activeClass =
  "bg-linear-to-r from-office-nav-active to-office-nav-active-to font-semibold shadow-md shadow-office-nav-active-border/60 ring-1 ring-office-nav-active-border";

type BackofficeNavProps = { propertyId: string; role: StaffRole; onNavigate?: () => void };

export function BackofficeNav({ propertyId, role, onNavigate }: BackofficeNavProps) {
  const pathname = usePathname();
  const items = buildNav(propertyId).filter((item) => !item.capability || can({ role }, item.capability));
  return (
    <nav aria-label="Back Office">
      <ul className="space-y-1 [@media(max-height:50rem)]:space-y-0.5">
        {items.map((item) => (
          <li key={item.key}>
            <NavItemLink item={item} active={isActive(pathname, item)} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function NavItemLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={item.label}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(itemClass, "flex", active && activeClass)}
    >
      <Icon aria-hidden="true" className="size-5.5 shrink-0 text-office-icon" />
      <span className={LABEL}>{item.label}</span>
    </Link>
  );
}

