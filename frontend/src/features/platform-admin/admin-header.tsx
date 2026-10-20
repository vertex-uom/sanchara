import { Bell, ChevronDown, Globe, Search, Zap } from "lucide-react";
import type { AdminUser } from "@/lib/auth/admin";
import { AdminDrawerButton } from "./admin-sidebar-frame";
import { AdminUserMenu } from "./admin-user-menu";
import { ICON_STROKE } from "./sidebar-modes";

// Placeholder copy from the design. Each control is inert until its feature
// lands; see the TODOs on each one.
const REGION_LABEL = "All Regions";
const REGION_SUMMARY = "Production · 6 regions live";
const SEARCH_PLACEHOLDER = "Search owners, properties, users, IDs, tickets…";
const NOTIFICATION_COUNT = "9";

// TODO(region): replace with a real region selector once regions exist.
function RegionSelector() {
  return (
    <button
      type="button"
      aria-disabled="true"
      className="focus-ring flex min-h-11 shrink-0 items-center gap-3 rounded-xl text-left"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-[10px] bg-admin-primary-soft">
        <Globe aria-hidden="true" strokeWidth={ICON_STROKE} className="size-6 text-admin-primary" />
      </span>
      <span className="hidden lg:block">
        <span className="flex items-center gap-1">
          <span className="text-sm font-medium text-admin-heading">{REGION_LABEL}</span>
          <ChevronDown aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4 text-admin-icon" />
        </span>
        <span className="block text-[11px] text-admin-muted-text">{REGION_SUMMARY}</span>
      </span>
      <span className="sr-only lg:hidden">{REGION_LABEL}</span>
      <span className="sr-only"> (region selector coming soon)</span>
    </button>
  );
}

// TODO(search): wire to platform search; read-only placeholder for now.
function GlobalSearch() {
  return (
    <div className="hidden min-w-0 flex-1 justify-center md:flex">
      <label className="flex h-10.5 w-full max-w-95 items-center gap-2.5 rounded-full border border-admin-border bg-admin-card px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--brand-aqua)">
        <Search aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4.5 shrink-0 text-admin-icon" />
        <span className="sr-only">Search (coming soon)</span>
        <input
          type="search"
          readOnly
          placeholder={SEARCH_PLACEHOLDER}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-admin-heading outline-none placeholder:text-admin-muted-text"
        />
      </label>
    </div>
  );
}

// TODO(quick-actions): open the quick actions menu.
function QuickActions() {
  return (
    <button
      type="button"
      aria-disabled="true"
      className="focus-ring flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-admin-primary px-3.5 py-[9px] text-sm font-medium text-white sm:min-h-0"
    >
      <Zap aria-hidden="true" strokeWidth={ICON_STROKE} className="size-4 sm:hidden" />
      <span className="hidden sm:inline">Quick actions</span>
      <span className="sr-only sm:hidden">Quick actions</span>
      <span className="sr-only"> (coming soon)</span>
    </button>
  );
}

// TODO(notifications): replace the static badge with the unread count and a panel.
function Notifications() {
  return (
    <button
      type="button"
      aria-disabled="true"
      className="focus-ring relative flex size-11 shrink-0 items-center justify-center rounded-[10px] text-admin-icon"
    >
      <span className="relative flex size-7 items-center justify-center">
        <Bell aria-hidden="true" strokeWidth={ICON_STROKE} className="size-6" />
        <span
          aria-hidden="true"
          className="absolute -top-1 left-3.5 rounded-[9px] border-2 border-white bg-admin-danger px-1.25 py-px text-[10px] leading-[14px] font-semibold text-white"
        >
          {NOTIFICATION_COUNT}
        </span>
      </span>
      <span className="sr-only">Notifications, {NOTIFICATION_COUNT} unread (coming soon)</span>
    </button>
  );
}

export function AdminHeader({ user }: { user: AdminUser }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-admin-canvas px-4 sm:gap-4 sm:px-6 md:h-20 md:gap-5 md:px-8">
      <AdminDrawerButton />
      <RegionSelector />
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-3 md:gap-5">
        <QuickActions />
        <Notifications />
        <AdminUserMenu fullName={user.fullName} roleLabel={user.roleLabel} />
      </div>
    </header>
  );
}
