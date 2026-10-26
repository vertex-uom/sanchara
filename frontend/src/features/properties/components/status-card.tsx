import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DialogActions } from "@/components/ui/dialog-actions";
import { ToneChip } from "@/components/ui/tone-chip";
import { UrlDialog } from "@/components/ui/url-dialog";
import { FlatCard } from "@/components/ui/widget";
import { setStatusAction } from "../actions";
import type { PropertySettings } from "../types";

const buttonClass = "h-11 rounded-lg bg-card px-4 md:h-9";

// Deactivating asks first (DeactivatePropertyDialog); activating doesn't.
export function StatusCard({ property, deactivateHref }: { property: PropertySettings; deactivateHref: string }) {
  const active = property.status === "active";
  return (
    <FlatCard aria-labelledby="status-title">
      <h2 id="status-title" className="mb-4 text-base font-semibold">
        Property status
      </h2>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToneChip tone={active ? "success" : "danger"} dot>
          {active ? "Active" : "Inactive"}
        </ToneChip>
        {active ? (
          <Button asChild variant="outline" className={buttonClass}>
            <Link href={deactivateHref} scroll={false}>
              Deactivate
            </Link>
          </Button>
        ) : (
          <form action={setStatusAction}>
            <input type="hidden" name="propertyId" value={property.id} />
            <input type="hidden" name="status" value="active" />
            <Button type="submit" variant="office" className="h-11 rounded-lg px-4 md:h-9">
              Activate
            </Button>
          </form>
        )}
      </div>
      <p className="mt-3 text-xs text-office-muted">
        {active
          ? "Your property is currently active and visible on your website."
          : "Your property is hidden from your website and booking channels."}
      </p>
    </FlatCard>
  );
}

export function DeactivatePropertyDialog({ property, closeHref }: { property: PropertySettings; closeHref: string }) {
  return (
    <UrlDialog title="Deactivate property" closeHref={closeHref} variant="dialog">
      <form action={setStatusAction} className="flex flex-col gap-5">
        <input type="hidden" name="propertyId" value={property.id} />
        <input type="hidden" name="status" value="inactive" />
        <p className="text-sm text-office-label">
          <span className="font-semibold text-foreground">{property.name}</span> will be hidden from your website and
          booking channels, and guests won&apos;t be able to book it. Existing reservations are kept. You can activate it
          again at any time.
        </p>
        <DialogActions closeHref={closeHref}>
          <Button type="submit" variant="office-danger" className="h-11 rounded-lg text-base md:h-10">
            Deactivate
          </Button>
        </DialogActions>
      </form>
    </UrlDialog>
  );
}
