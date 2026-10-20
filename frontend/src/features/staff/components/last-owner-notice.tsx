import Link from "next/link";
import { Button } from "@/components/ui/button";
import { dialogButtonClass } from "@/components/ui/dialog-actions";
import { STAFF_ERROR_MESSAGES } from "../config";

// The last active Owner can't be demoted or deactivated; say why instead of offering a form.
export function LastOwnerNotice({ closeHref }: { closeHref: string }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-office-label">{STAFF_ERROR_MESSAGES.LAST_OWNER} Add or reactivate another Owner first.</p>
      <Button asChild variant="outline" className={`${dialogButtonClass} bg-card`}>
        <Link href={closeHref} replace scroll={false}>
          Close
        </Link>
      </Button>
    </div>
  );
}
