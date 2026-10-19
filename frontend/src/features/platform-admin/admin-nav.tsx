"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, isAdminNavActive, type AdminNavItem } from "./nav";
import { ICON_STROKE, SIDEBAR_ITEM_INSET, SIDEBAR_LABEL, SIDEBAR_RAIL_CENTER } from "./sidebar-modes";

function AdminNavLink({ item, active, onNavigate }: { item: AdminNavItem; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={item.label}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        // The two longest labels run a few pixels into the 8px right inset
        // rather than wrapping, as they do in Figma.
        "focus-ring flex h-10 w-full items-center gap-3 rounded-[10px] text-[13.5px] text-admin-body transition-colors hover:bg-admin-card/70 motion-reduce:transition-none",
        SIDEBAR_ITEM_INSET,
        SIDEBAR_RAIL_CENTER,
        item.compactLabel && "text-[12.5px]",
        active && "admin-nav-active rounded-[12px] font-semibold text-admin-heading",
      )}
    >
      <Icon aria-hidden="true" strokeWidth={ICON_STROKE} className="size-5 shrink-0 text-admin-icon" />
      <span className={cn(SIDEBAR_LABEL, "min-w-0 flex-1")}>
        <span className="whitespace-nowrap">{item.label}</span>
      </span>
    </Link>
  );
}

// Primary navigation of the Platform Admin console. One entry per tab, in
// the design's order, from the ADMIN_NAV config.
export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Platform Admin">
      <ul className="flex flex-col gap-0.5">
        {ADMIN_NAV.map((item) => (
          <li key={item.key}>
            <AdminNavLink item={item} active={isAdminNavActive(pathname, item)} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    </nav>
  );
}
