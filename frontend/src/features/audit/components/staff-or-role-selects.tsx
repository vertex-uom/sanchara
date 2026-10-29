"use client";

import { useState } from "react";
import { STAFF_ROLE_LABELS, STAFF_ROLES, type StaffRole } from "@/lib/auth/staff";
import { NativeSelect } from "@/components/ui/field";
import type { AuditPage } from "../types";

type StaffOrRoleSelectsProps = { staffId: string | null; role: StaffRole | null; actors: AuditPage["actors"] };

// Filter by one person or by a role, not both: choosing one disables the
// other until it is back on "All". A disabled select isn't submitted, and the
// URL parser drops the role if both still arrive (no JS).
export function StaffOrRoleSelects({ staffId, role, actors }: StaffOrRoleSelectsProps) {
  const [staff, setStaff] = useState(staffId ?? "");
  const [selectedRole, setSelectedRole] = useState(role ?? "");

  return (
    <>
      <NativeSelect
        id="audit-staff"
        name="staff"
        label="Staff"
        labelHidden
        defaultValue={staff}
        disabled={selectedRole !== ""}
        title={selectedRole ? "Set the role back to All roles to filter by staff member" : undefined}
        onChange={setStaff}
        options={[{ value: "", label: "All staff" }, ...actors.map((actor) => ({ value: actor.id, label: actor.name }))]}
        className="w-full sm:w-44"
      />
      <NativeSelect
        id="audit-role"
        name="role"
        label="Role"
        labelHidden
        defaultValue={selectedRole}
        disabled={staff !== ""}
        title={staff ? "Set staff back to All staff to filter by role" : undefined}
        onChange={setSelectedRole}
        options={[{ value: "", label: "All roles" }, ...STAFF_ROLES.map((value) => ({ value, label: STAFF_ROLE_LABELS[value] }))]}
        className="w-full sm:w-40"
      />
      <p role="status" className="sr-only">
        {staff ? "Role filter unavailable while a staff member is chosen." : selectedRole ? "Staff filter unavailable while a role is chosen." : ""}
      </p>
    </>
  );
}
