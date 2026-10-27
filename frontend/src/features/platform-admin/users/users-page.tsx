import { Suspense } from "react";
import { type SearchParams } from "@/lib/routes/search-params";
import { AdminPageHeader } from "../components/page-header";
import { AdminSubTabs } from "../components/sub-tabs";
import { AdminSkeleton } from "../components/ui";
import { adminNavItem } from "../nav";
import { getStaffFilterOptions, getStaffRoleCounts } from "../server/users";
import type { StaffFilters } from "../types";
import { FiltersBar } from "./filters-bar";
import { parseFilters, ROLE_TAB_LABELS, ROLE_TABS, usersHref } from "./search-params";
import { DetailPlaceholder, UserDetail } from "./user-detail";
import { UsersTable } from "./users-table";

type Props = {
  searchParams: Promise<SearchParams>;
  // Set by the /users/[userId] route; opens the detail panel (beside the
  // list from xl, on its own below).
  params?: Promise<{ userId: string }>;
};

// Users: staff accounts across all companies. The list state (role tab,
// filters, page) lives in the URL. Everything that reads the URL renders
// inside one Suspense boundary so the page header streams first.
export function UsersPage({ searchParams, params }: Props) {
  const item = adminNavItem("users");
  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader title={item.pageTitle ?? item.label} description={item.description} />
      <Suspense fallback={<WorkspaceSkeleton />}>
        <Workspace searchParams={searchParams} params={params} />
      </Suspense>
    </div>
  );
}

async function Workspace({ searchParams, params }: Props) {
  const [query, route] = await Promise.all([searchParams, params]);
  const selectedId = route?.userId;
  const filters = parseFilters(query);
  const options = await getStaffFilterOptions();

  return (
    <>
      <RoleTabs filters={filters} />
      {/* Below xl an open user takes the whole screen: filters step aside. */}
      <FiltersBar filters={filters} options={options} className={selectedId ? "hidden xl:flex" : undefined} />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 xl:grid-cols-[minmax(0,704fr)_minmax(0,400fr)]">
        <UsersTable filters={filters} selectedId={selectedId} className={selectedId ? "hidden xl:block" : undefined} />
        {selectedId ? <UserDetail id={selectedId} filters={filters} /> : <DetailPlaceholder className="hidden xl:flex" />}
      </div>
    </>
  );
}

// The role tabs are the Role filter: they keep the other filters and reset
// the page.
async function RoleTabs({ filters }: { filters: StaffFilters }) {
  const counts = await getStaffRoleCounts();
  return (
    <AdminSubTabs
      label="Roles"
      active={filters.role}
      tabs={ROLE_TABS.map((role) => ({
        key: role,
        label: ROLE_TAB_LABELS[role],
        count: counts[role],
        href: usersHref({ ...filters, role, page: 1 }),
      }))}
    />
  );
}

function WorkspaceSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">Loading users</span>
      <AdminSkeleton className="h-[34px] w-96 max-w-full" />
      <AdminSkeleton className="h-[88px] rounded-[14px]" />
      <AdminSkeleton className="h-[520px] rounded-[14px]" />
    </div>
  );
}
