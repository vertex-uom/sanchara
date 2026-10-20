import { Crown, User, Users, type LucideIcon } from "lucide-react";
import type { StaffRole } from "@/lib/auth/staff";
import { RadioCards } from "@/components/ui/radio-cards";
import { ROLE_META } from "../config";

const ROLE_ICONS: Record<StaffRole, LucideIcon> = { owner: Crown, manager: Users, "front-desk": User };

type RoleOptionsProps = {
  legend: string;
  // Only the roles the signed-in user may assign.
  roles: readonly StaffRole[];
  defaultValue: string;
  error?: string;
};

export function RoleOptions({ legend, roles, defaultValue, error }: RoleOptionsProps) {
  return (
    <RadioCards
      name="role"
      legend={legend}
      defaultValue={defaultValue}
      error={error}
      options={roles.map((role) => ({ value: role, ...ROLE_META[role], icon: ROLE_ICONS[role] }))}
    />
  );
}
