import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { AdminSkeleton } from "../components/ui";
import { adminNavItem } from "../nav";
import { InviteAdminDialog } from "./admin-actions";
import { AdminsTable } from "./admins-table";
import { AccessPolicy, AccountChanges } from "./side-cards";

type SearchParams = Record<string, string | string[] | undefined>;

// Admin Users: the WEMIXT platform-team accounts that can open this console.
// One role, so no roles, permission matrix or policies to edit — just the
// account list, the fixed access policy and recent account changes.
export function AdminUsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const item = adminNavItem("admin-users");
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={item.pageTitle ?? item.label} description={item.description} actions={<InviteAdminDialog />} />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 xl:grid-cols-[minmax(0,704fr)_minmax(0,400fr)]">
        <Suspense fallback={<AdminSkeleton className="h-[640px] rounded-[14px]" />}>
          <Table searchParams={searchParams} />
        </Suspense>
        <div className="flex flex-col gap-4">
          <AccessPolicy />
          <AccountChanges />
        </div>
      </div>
    </div>
  );
}

async function Table({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const raw = Array.isArray(query.page) ? query.page[0] : query.page;
  const page = Number.parseInt(raw ?? "1", 10);
  return <AdminsTable page={Number.isFinite(page) && page > 0 ? page : 1} />;
}
