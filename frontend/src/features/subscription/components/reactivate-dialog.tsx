import { formatDateOnly } from "@/lib/format/dates";
import { Button } from "@/components/ui/button";
import { DialogActions, dialogButtonClass } from "@/components/ui/dialog-actions";
import { UrlDialog } from "@/components/ui/url-dialog";
import { reactivateAction } from "../actions";
import { subscriptionHref } from "../subscription-params";

// Confirmation before undoing a cancellation: the plan renews as before.
export function ReactivateDialog({ planName, renewsOn }: { planName: string; renewsOn: string }) {
  const closeHref = subscriptionHref();
  return (
    <UrlDialog title="Reactivate subscription" closeHref={closeHref} variant="dialog">
      <form action={reactivateAction} className="flex flex-col gap-5">
        <p className="text-sm text-office-label">
          Your <span className="font-semibold text-foreground">{planName}</span> will stay active and renew on{" "}
          <span className="font-semibold text-foreground">{formatDateOnly(renewsOn)}</span>, billed as before.
        </p>
        <DialogActions closeHref={closeHref} cancelLabel="Not now">
          <Button type="submit" variant="office" className={dialogButtonClass}>
            Reactivate
          </Button>
        </DialogActions>
      </form>
    </UrlDialog>
  );
}
