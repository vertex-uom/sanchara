import { Crown, User, Users, type LucideIcon } from "lucide-react";
import type { StaffRole } from "@/lib/auth/staff";
import { ROLE_META } from "../config";

const ROLE_ICONS: Record<StaffRole, LucideIcon> = { owner: Crown, manager: Users, "front-desk": User };

type RoleOptionsProps = {
  legend: string;
  // Only the roles the signed-in user may assign.
  roles: readonly StaffRole[];
  defaultValue: string;
  error?: string;
};

// Role radio cards. The native radio is visually hidden; the card shows its
// state with a border, a filled dot and focus outline.
export function RoleOptions({ legend, roles, defaultValue, error }: RoleOptionsProps) {
  return (
    <fieldset aria-describedby={error ? "staff-role-error" : undefined}>
      <legend className="mb-3 text-sm font-medium">{legend}</legend>
      <div className="space-y-4">
        {roles.map((role) => {
          const { label, description } = ROLE_META[role];
          const Icon = ROLE_ICONS[role];
          return (
            <label
              key={role}
              className="group flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 transition-colors has-checked:border-office-chart-bright has-checked:bg-background has-checked:ring-1 has-checked:ring-office-chart-bright has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-office-primary motion-reduce:transition-none"
            >
              <Icon aria-hidden="true" className="size-7 shrink-0 text-office-icon" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{label}</span>
                <span className="block text-sm text-office-muted">{description}</span>
              </span>
              <input type="radio" name="role" value={role} defaultChecked={role === defaultValue} className="sr-only" />
              <span
                aria-hidden="true"
                className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-office-muted group-has-checked:border-office-primary"
              >
                <span className="size-2.5 rounded-full bg-office-primary opacity-0 group-has-checked:opacity-100" />
              </span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p id="staff-role-error" className="mt-2 text-sm text-office-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
