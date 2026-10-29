import { assignableRoles, canManageStaff } from "@/lib/auth/permissions";
import type { StaffUser } from "@/lib/auth/staff";
import { EmptyState, FlatCard } from "@/components/ui/widget";
import type { StaffFilters } from "../staff-params";
import type { StaffMember } from "../types";
import { RoleChip, StaffActions, StaffIdentity, StatusChip } from "./staff-row-parts";

type StaffListProps = { members: StaffMember[]; user: StaffUser; filters: StaffFilters };

const headClass = "px-3.5 py-3 text-left text-sm font-medium text-office-muted";
const cellClass = "px-3.5 py-3.5 align-middle";

// A table from md; the same rows as cards on phones.
export function StaffList({ members, user, filters }: StaffListProps) {
  if (members.length === 0) return <EmptyState>No staff match your filters.</EmptyState>;

  const canChangeRole = assignableRoles(user).length > 1;
  const rows = members.map((member) => ({ member, manageable: member.manageable && canManageStaff(user, member) }));

  return (
    <>
      <FlatCard className="hidden p-2 sm:p-2 md:block">
        <table className="w-full">
          <caption className="sr-only">Staff accounts</caption>
          <thead>
            <tr>
              <th scope="col" className={headClass}>
                Name
              </th>
              <th scope="col" className={headClass}>
                Email
              </th>
              <th scope="col" className={headClass}>
                Role
              </th>
              <th scope="col" className={headClass}>
                Status
              </th>
              <th scope="col" className={headClass}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ member, manageable }) => (
              <tr key={member.id} className="border-t border-border">
                <th scope="row" className={`${cellClass} text-left font-normal`}>
                  <StaffIdentity member={member} />
                </th>
                <td className={`${cellClass} text-sm break-all text-office-muted`}>{member.email}</td>
                <td className={cellClass}>
                  <RoleChip member={member} />
                </td>
                <td className={cellClass}>
                  <StatusChip member={member} />
                </td>
                <td className={cellClass}>
                  <StaffActions member={member} manageable={manageable} canChangeRole={canChangeRole} filters={filters} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </FlatCard>

      <ul aria-label="Staff accounts" className="space-y-3 md:hidden">
        {rows.map(({ member, manageable }) => (
          <li key={member.id} className="rounded-xl border border-border bg-card p-4">
            <StaffIdentity member={member} />
            <p className="mt-2 text-sm break-all text-office-muted">{member.email}</p>
            <p className="mt-3 flex flex-wrap gap-2">
              <RoleChip member={member} />
              <StatusChip member={member} />
            </p>
            <div className="mt-2">
              <StaffActions member={member} manageable={manageable} canChangeRole={canChangeRole} filters={filters} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
