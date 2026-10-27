import { Search, Zap } from "lucide-react";
import { DashboardNotifications } from "@/components/notifications/dashboard-notifications";
import type { AdminUser } from "@/lib/auth/admin";
import { AdminDrawerButton } from "./admin-sidebar-frame";
import { AdminUserMenu } from "./admin-user-menu";
import { ProvinceFilterMenu } from "./province-filter-menu";
import { listProvinces, provinceLabel, readProvinceFilter } from "./server/province-filter";
import { ICON_STROKE } from "./sidebar-modes";

// Placeholder copy from the design. Each control is inert until its feature
// lands; see the TODOs on each one.
const SEARCH_PLACEHOLDER = "Search owners, properties, users, IDs, tickets…";

// The province filter: options from the API, the current choice from its cookie.
async function RegionSelector() {
  const [provinces, selectedId] = await Promise.all([listProvinces(), readProvinceFilter()]);
  const options = provinces.map((province) => ({ id: province.id, label: provinceLabel(province.name), companies: province.companies }));
  return <ProvinceFilterMenu options={options} selectedId={selectedId} />;
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

export function AdminHeader({ user }: { user: AdminUser }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-admin-canvas px-4 sm:gap-4 sm:px-6 md:h-20 md:gap-5 md:px-8">
      <AdminDrawerButton />
      <RegionSelector />
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-3 md:gap-5">
        <QuickActions />
        <DashboardNotifications variant="admin" />
        <AdminUserMenu fullName={user.fullName} roleLabel={user.roleLabel} />
      </div>
    </header>
  );
}
