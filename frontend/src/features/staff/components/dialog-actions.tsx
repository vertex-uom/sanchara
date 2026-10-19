import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { STAFF_ERROR_MESSAGES } from "../config";

const cancelClass = "h-11 rounded-lg bg-card text-base md:h-10";

// Cancel (back to the list) and the submit button at the end of a staff dialog.
export function DialogActions({ closeHref, children }: { closeHref: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Button asChild variant="outline" className={cancelClass}>
        <Link href={closeHref} replace scroll={false}>
          Cancel
        </Link>
      </Button>
      {children}
    </div>
  );
}

// The last active Owner can't be demoted or deactivated; say why instead of offering a form.
export function LastOwnerNotice({ closeHref }: { closeHref: string }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-office-label">{STAFF_ERROR_MESSAGES.LAST_OWNER} Add or reactivate another Owner first.</p>
      <Button asChild variant="outline" className={cancelClass}>
        <Link href={closeHref} replace scroll={false}>
          Close
        </Link>
      </Button>
    </div>
  );
}
