import { formatDateOnly } from "@/lib/format/dates";
import { Button } from "@/components/ui/button";
import { DialogActions, dialogButtonClass } from "@/components/ui/dialog-actions";
import { UrlDialog } from "@/components/ui/url-dialog";
import { cancelAction } from "../actions";
import { subscriptionHref } from "../subscription-params";

// Confirmation before cancelling. What happens after the end date is still open in v8.
export function CancelDialog({ planName, renewsOn }: { planName: string; renewsOn: string }) {
  const closeHref = subscriptionHref();
  return (
    <UrlDialog title="Cancel subscription" closeHref={closeHref} variant="dialog">
      <form action={cancelAction} className="flex flex-col gap-5">
        <p className="text-sm text-office-label">
          Your <span className="font-semibold text-foreground">{planName}</span> stays active until{" "}
          <span className="font-semibold text-foreground">{formatDateOnly(renewsOn)}</span>. It won&apos;t renew after that.
        </p>
        <DialogActions closeHref={closeHref} cancelLabel="Keep subscription">
          <Button type="submit" variant="office-danger" className={dialogButtonClass}>
            Cancel subscription
          </Button>
        </DialogActions>
      </form>
    </UrlDialog>
  );
}
