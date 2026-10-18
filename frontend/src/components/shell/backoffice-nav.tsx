"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  CalendarDays,
  CalendarRange,
  ChartNoAxesColumn,
  ChevronDown,
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
export const RAIL_ONLY = "flex lg:hidden group-data-[mode=rail]/sidebar:flex group-data-[mode=full]/sidebar:hidden";
const LABEL = "sr-only lg:not-sr-only group-data-[mode=rail]/sidebar:sr-only group-data-[mode=full]/sidebar:not-sr-only";

type NavLink = { key: string; label: string; href: string };
type NavItem = NavLink & { icon: LucideIcon; children?: NavLink[]; exact?: boolean };

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
      children: [
        { key: "room-types", label: "Room types", href: p("config/room-types") },
        { key: "units", label: "Units", href: p("config/units") },
      ],
    },
    {
      key: "rates",
      label: "Rates & Seasons",
      icon: Diamond,
      href: p("config/rate-plans"),
      children: [
        { key: "rate-plans", label: "Rate plans", href: p("config/rate-plans") },
        { key: "rate-cards", label: "Rate cards", href: p("config/rate-cards") },
        { key: "seasons", label: "Seasons", href: p("config/seasons") },
      ],
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
      children: [
        { key: "policies", label: "Policies", href: p("config/policies") },
        { key: "restrictions", label: "Restrictions", href: p("config/restrictions") },
      ],
    },
  ];
}

function matches(pathname: string, href: string, exact = false) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

const itemClass =
  "focus-ring min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-office-text transition-colors hover:bg-office-nav-active motion-reduce:transition-none";
const activeClass = "bg-office-nav-active font-semibold text-foreground shadow-sm ring-1 ring-office-nav-active-border";

export function BackofficeNav({ propertyId, onNavigate }: { propertyId: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Back Office">
      <ul className="space-y-1">
        {buildNav(propertyId).map((item) =>
          item.children ? (
            <NavGroup key={item.key} item={item} pathname={pathname} onNavigate={onNavigate} />
          ) : (
            <li key={item.key}>
              <NavItemLink item={item} active={matches(pathname, item.href, item.exact)} onNavigate={onNavigate} />
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}

function NavItemLink({ item, active, onNavigate, className }: { item: NavItem; active: boolean; onNavigate?: () => void; className?: string }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={item.label}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(itemClass, className ?? "flex", active && activeClass)}
    >
      <Icon aria-hidden="true" className="size-5 shrink-0 text-office-icon" />
      <span className={LABEL}>{item.label}</span>
    </Link>
  );
}

// Full mode: a disclosure with sub-links. Rail mode: one link to the first sub-page.
function NavGroup({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate?: () => void }) {
  const children = item.children ?? [];
  const groupActive = children.some((child) => matches(pathname, child.href));
  const [open, setOpen] = useState(groupActive);
  const Icon = item.icon;
  const listId = useId();

  return (
    <li>
      <NavItemLink item={item} active={groupActive} onNavigate={onNavigate} className={RAIL_ONLY} />
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className={cn(itemClass, FULL_ONLY, groupActive && !open && activeClass)}
      >
        <Icon aria-hidden="true" className="size-5 shrink-0 text-office-icon" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown aria-hidden="true" className={cn("size-4 shrink-0 transition-transform motion-reduce:transition-none", open && "rotate-180")} />
      </button>
      <ul id={listId} className={cn(FULL_ONLY, "mt-1 ml-5 flex-col gap-1 border-l border-border pl-3", !open && "hidden!")}>
        {children.map((child) => {
          const active = matches(pathname, child.href);
          return (
            <li key={child.key}>
              <Link
                href={child.href}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                className={cn(itemClass, "flex min-h-10", active && activeClass)}
              >
                {child.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </li>
  );
}
