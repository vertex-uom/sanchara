import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Info } from "lucide-react";
import { assignableRoles, can, canManageStaff } from "@/lib/auth/permissions";
import { getCurrentStaff } from "@/lib/auth/staff";
import { UrlDialog } from "@/components/ui/url-dialog";
import { getCompanyProperties } from "@/features/properties";
import {
  AddStaffForm,
  ChangeRoleDialog,
  DeactivateDialog,
  getStaffMember,
  listStaff,
  parseStaffParams,
  previewDeactivation,
  SeatUsage,
  STAFF_ERROR_MESSAGES,
  StaffFilters,
  StaffHeader,
  StaffList,
  StaffSkeleton,
  staffHref,
} from "@/features/staff";

export const metadata = { title: "Staff Management" };

type StaffProps = Pick<PageProps<"/backoffice/company/staff">, "searchParams">;

// Company staff (Owner and Manager). Filters and the open panel live in the
// URL; changes go through Server Actions that re-check capabilities.
export default function Page({ searchParams }: PageProps<"/backoffice/company/staff">) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex flex-col gap-6 px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-6 xl:flex-row xl:items-start"
    >
      <Suspense fallback={<StaffSkeleton />}>
        <StaffManagement searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function StaffManagement({ searchParams }: StaffProps) {
  const [query, user] = await Promise.all([searchParams, getCurrentStaff()]);
  if (!can(user, "staff.read")) redirect("/forbidden");

  const { panel, staffId, error, ...filters } = parseStaffParams(query);
  const [list, properties, target] = await Promise.all([
    listStaff(filters),
    getCompanyProperties(),
    staffId ? getStaffMember(staffId) : null,
  ]);
  const roles = assignableRoles(user);
  const limitReached = list.seats.used >= list.seats.limit;
  const listHref = staffHref(filters);
  // Panels for an account the user may not manage are simply not shown.
  const managed = target && canManageStaff(user, target) ? target : null;
  const preview = panel === "deactivate" && managed?.status === "active" ? await previewDeactivation(managed.id) : null;
  // Staff are per company; the design shows the (first) property like the shell does.
  const property = properties[0];

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <StaffHeader
          place={property ? { name: property.name, location: `${property.town}, ${property.country}` } : undefined}
          addHref={staffHref(filters, { panel: "add" })}
          limitReached={limitReached}
        />
        {error ? (
          <p role="alert" className="rounded-xl border border-office-danger/40 bg-card px-4 py-3 text-sm font-medium text-office-danger">
            {STAFF_ERROR_MESSAGES[error]}
          </p>
        ) : null}
        <SeatUsage seats={list.seats} />
        <StaffFilters filters={filters} />
        <StaffList members={list.members} user={user} filters={filters} />
        <p className="flex items-center gap-2 text-sm text-office-muted">
          <Info aria-hidden="true" className="size-4 shrink-0 text-office-icon" />
          Every staff change is recorded in the audit trail.
        </p>
      </div>

      {panel === "add" && roles.length > 0 && !limitReached ? (
        <UrlDialog title="Add staff" closeHref={listHref} variant="panel">
          <AddStaffForm roles={roles} listHref={listHref} />
        </UrlDialog>
      ) : null}
      {panel === "role" && managed && roles.length > 1 ? (
        <ChangeRoleDialog member={managed} roles={roles} listHref={listHref} />
      ) : null}
      {panel === "deactivate" && managed && preview ? (
        <DeactivateDialog member={managed} preview={preview} listHref={listHref} />
      ) : null}
    </>
  );
}
