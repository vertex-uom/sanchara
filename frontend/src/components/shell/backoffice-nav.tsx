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
import { COMPANY_PATHS, propertyPath } from "@/lib/routes/backoffice";
import { cn } from "@/lib/utils";

// The sidebar is a "group/sidebar" with data-mode = auto | rail | full.
// auto: icon rail from md, full labels from lg. The drawer is always full.
export const FULL_ONLY = "hidden lg:flex group-data-[mode=rail]/sidebar:hidden group-data-[mode=full]/sidebar:flex";
const LABEL = "sr-only lg:not-sr-only group-data-[mode=rail]/sidebar:sr-only group-data-[mode=full]/sidebar:not-sr-only";

// activeFor: other pages that keep this item highlighted.
type NavItem = { key: string; label: string; href: string; icon: LucideIcon; activeFor?: string[]; exact?: boolean };

// Role-based visibility is added later from /me capabilities; for now the
// Owner sees every item.
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
      href: p("config/rate-plans"),
      activeFor: [p("config/rate-cards"), p("config/seasons")],
    },
    { key: "packages", label: "Packages", icon: Package, href: p("packages") },
    { key: "payments", label: "Payments & Refunds", icon: CreditCard, href: p("payments") },
    { key: "reports", label: "Reports", icon: ChartNoAxesColumn, href: p("reports") },
    { key: "reviews", label: "Reviews", icon: Star, href: p("reviews") },
    { key: "website", label: "Website Builder", icon: Monitor, href: COMPANY_PATHS.website },
    { key: "staff", label: "Staff Management", icon: Users, href: COMPANY_PATHS.staff },
    { key: "subscription", label: "Subscription & Plan", icon: Crown, href: COMPANY_PATHS.subscription },
    { key: "audit", label: "Audit Trail", icon: ScrollText, href: COMPANY_PATHS.audit },
    {
      key: "settings",
      label: "Property Settings",
      icon: Settings,
      href: p("config/policies"),
      activeFor: [p("config/restrictions")],
    },
  ];
}

function matches(pathname: string, href: string, exact = false) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function isActive(pathname: string, item: NavItem) {
  return [item.href, ...(item.activeFor ?? [])].some((href) => matches(pathname, href, item.exact));
}

const itemClass =
  "focus-ring min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-office-text transition-colors hover:bg-office-nav-active motion-reduce:transition-none";
const activeClass = "bg-office-nav-active font-semibold text-foreground shadow-sm ring-1 ring-office-nav-active-border";

export function BackofficeNav({ propertyId, onNavigate }: { propertyId: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Back Office">
      <ul className="space-y-1">
        {buildNav(propertyId).map((item) => (
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
      <Icon aria-hidden="true" className="size-5 shrink-0 text-office-icon" />
      <span className={LABEL}>{item.label}</span>
    </Link>
  );
}

