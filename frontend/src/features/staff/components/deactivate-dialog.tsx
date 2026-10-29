import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogActions } from "@/components/ui/dialog-actions";
import { UrlDialog } from "@/components/ui/url-dialog";
import { deactivateAction } from "../actions";
import { FRONT_DESK_HANDOVER } from "../config";
import type { DeactivationPreview, StaffMember } from "../types";

type DeactivateDialogProps = { member: StaffMember; preview: DeactivationPreview; listHref: string };

// Confirmation before deactivating; notes when front-desk work changes hands.
export function DeactivateDialog({ member, preview, listHref }: DeactivateDialogProps) {
  const handover = preview.frontDeskMovesTo ? FRONT_DESK_HANDOVER[preview.frontDeskMovesTo] : undefined;
  return (
    <UrlDialog title="Deactivate account" closeHref={listHref} variant="dialog">
      <form action={deactivateAction} className="flex flex-col gap-5">
          <input type="hidden" name="staffId" value={member.id} />
          <input type="hidden" name="returnTo" value={listHref} />
          <p className="text-sm text-office-label">
            <span className="font-semibold text-foreground">{member.fullName}</span>{" "}
            {member.status === "invited" ? "won't be able to use their invite." : "will be signed out and can no longer sign in."} You can reactivate the
            account later.
          </p>
          {handover ? (
            <p className="flex gap-2 rounded-lg bg-office-chip p-3 text-sm text-office-label">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-office-icon" />
              {handover}
            </p>
          ) : null}
          <DialogActions closeHref={listHref}>
            <Button type="submit" variant="office-danger" className="h-11 rounded-lg text-base md:h-10">
              Deactivate
            </Button>
          </DialogActions>
        </form>
    </UrlDialog>
  );
}
