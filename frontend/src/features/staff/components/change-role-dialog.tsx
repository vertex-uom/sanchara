import type { StaffRole } from "@/lib/auth/staff";
import { Button } from "@/components/ui/button";
import { DialogActions } from "@/components/ui/dialog-actions";
import { UrlDialog } from "@/components/ui/url-dialog";
import { changeRoleAction } from "../actions";
import type { StaffMember } from "../types";
import { RoleOptions } from "./role-options";

type ChangeRoleDialogProps = { member: StaffMember; roles: readonly StaffRole[]; listHref: string };

export function ChangeRoleDialog({ member, roles, listHref }: ChangeRoleDialogProps) {
  return (
    <UrlDialog title="Change role" closeHref={listHref} variant="dialog">
      <form action={changeRoleAction} className="flex flex-col gap-5">
          <input type="hidden" name="staffId" value={member.id} />
          <input type="hidden" name="returnTo" value={listHref} />
          <p className="text-sm text-office-label">
            Choose a new role for <span className="font-semibold text-foreground">{member.fullName}</span>.
          </p>
          <RoleOptions legend="Role" roles={roles} defaultValue={member.role} />
          <DialogActions closeHref={listHref}>
            <Button type="submit" variant="office" className="h-11 rounded-lg text-base md:h-10">
              Save role
            </Button>
          </DialogActions>
        </form>
    </UrlDialog>
  );
}
