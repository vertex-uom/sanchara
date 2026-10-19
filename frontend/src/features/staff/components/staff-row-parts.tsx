import Link from "next/link";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { ToneChip } from "@/components/ui/tone-chip";
import { reactivateAction } from "../actions";
import { ROLE_META } from "../config";
import { staffHref, type StaffFilters } from "../staff-params";
import type { StaffMember } from "../types";

// Pieces shared by the desktop table and the phone cards.

export function StaffIdentity({ member }: { member: StaffMember }) {
  return (
    <span className="flex items-center gap-3">
      <Avatar id={member.id} name={member.fullName} />
      <span className="font-semibold">{member.fullName}</span>
    </span>
  );
}

export function RoleChip({ member }: { member: StaffMember }) {
  return <ToneChip tone="outline">{ROLE_META[member.role].label}</ToneChip>;
}

export function StatusChip({ member }: { member: StaffMember }) {
  return member.status === "active" ? (
    <ToneChip tone="success">Active</ToneChip>
  ) : (
    <ToneChip tone="neutral">Inactive</ToneChip>
  );
}

type StaffActionsProps = {
  member: StaffMember;
  // From canManageStaff: the user may assign this account's role and it isn't their own.
  manageable: boolean;
  // Only useful when the user can assign more than one role.
  canChangeRole: boolean;
  filters: StaffFilters;
};

const actionClass = "focus-ring inline-flex min-h-11 items-center rounded-md text-sm md:min-h-8";

export function StaffActions({ member, manageable, canChangeRole, filters }: StaffActionsProps) {
  if (!manageable) return <span className="text-sm text-office-muted">View only</span>;
  const forName = <span className="sr-only"> {member.fullName}</span>;

  return (
    <div className="flex flex-wrap items-center gap-x-6">
      {canChangeRole ? (
        <Link
          href={staffHref(filters, { panel: "role", staffId: member.id })}
          scroll={false}
          className={cn(actionClass, "text-office-muted hover:text-foreground")}
        >
          Change role<span className="sr-only"> for</span>
          {forName}
        </Link>
      ) : null}
      {member.status === "active" ? (
        <Link
          href={staffHref(filters, { panel: "deactivate", staffId: member.id })}
          scroll={false}
          className={cn(actionClass, "font-medium text-office-danger hover:underline")}
        >
          Deactivate{forName}
        </Link>
      ) : (
        <form action={reactivateAction}>
          <input type="hidden" name="staffId" value={member.id} />
          <input type="hidden" name="returnTo" value={staffHref(filters)} />
          <button type="submit" className={cn(actionClass, "cursor-pointer font-medium text-office-primary hover:underline")}>
            Reactivate{forName}
          </button>
        </form>
      )}
    </div>
  );
}
