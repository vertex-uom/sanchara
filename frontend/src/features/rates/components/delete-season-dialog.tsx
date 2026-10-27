import { Button } from "@/components/ui/button";
import { DialogActions, dialogButtonClass } from "@/components/ui/dialog-actions";
import { UrlDialog } from "@/components/ui/url-dialog";
import { formatDateOnly } from "@/lib/format/dates";
import { deleteSeasonAction } from "../actions";
import type { Season } from "../types";

// Confirmation before deleting; the season's rates go with it.
export function DeleteSeasonDialog({ propertyId, season, closeHref }: { propertyId: string; season: Season; closeHref: string }) {
  return (
    <UrlDialog title="Delete season" closeHref={closeHref} variant="dialog">
      <form action={deleteSeasonAction} className="flex flex-col gap-5">
        <input type="hidden" name="propertyId" value={propertyId} />
        <input type="hidden" name="seasonId" value={season.id} />
        <p className="text-sm text-office-label">
          <span className="font-semibold text-foreground">{season.name}</span> ({formatDateOnly(season.from)} – {formatDateOnly(season.to)})
          and its rates in every plan will be deleted. Those dates will use the base rate. This can&apos;t be undone.
        </p>
        <DialogActions closeHref={closeHref}>
          <Button type="submit" variant="office-danger" className={dialogButtonClass}>
            Delete
          </Button>
        </DialogActions>
      </form>
    </UrlDialog>
  );
}
