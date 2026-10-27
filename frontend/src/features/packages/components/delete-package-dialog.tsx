import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogActions } from "@/components/ui/dialog-actions";
import { UrlDialog } from "@/components/ui/url-dialog";
import { deletePackageAction } from "../actions";
import type { PackageFilters } from "../package-params";
import type { PackageDetail } from "../types";

type DeletePackageDialogProps = { propertyId: string; pkg: PackageDetail; filters: PackageFilters; closeHref: string };

// Confirmation before deleting; an active package is offered as a draft instead.
export function DeletePackageDialog({ propertyId, pkg, filters, closeHref }: DeletePackageDialogProps) {
  return (
    <UrlDialog title="Delete package" closeHref={closeHref} variant="dialog">
      <form action={deletePackageAction} className="flex flex-col gap-5">
        <input type="hidden" name="propertyId" value={propertyId} />
        <input type="hidden" name="packageId" value={pkg.id} />
        {filters.status ? <input type="hidden" name="status" value={filters.status} /> : null}
        {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}
        <p className="text-sm text-office-label">
          <span className="font-semibold text-foreground">{pkg.name}</span> and its itinerary will be deleted. This
          can&apos;t be undone.
        </p>
        {pkg.status === "active" ? (
          <p className="flex gap-2 rounded-lg bg-office-chip p-3 text-sm text-office-label">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-office-icon" />
            Guests can book this package now. To hide it but keep it, set it to Draft instead.
          </p>
        ) : null}
        <DialogActions closeHref={closeHref}>
          <Button type="submit" variant="office-danger" className="h-11 rounded-lg text-base md:h-10">
            Delete
          </Button>
        </DialogActions>
      </form>
    </UrlDialog>
  );
}
