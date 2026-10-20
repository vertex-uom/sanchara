import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dialogButtonClass = "h-11 rounded-lg text-base md:h-10";

// Cancel (back to the page the dialog opened from) and the submit button at the end of a dialog.
export function DialogActions({
  closeHref,
  cancelLabel = "Cancel",
  children,
}: {
  closeHref: string;
  // Rename when "Cancel" would be ambiguous (e.g. next to "Cancel subscription").
  cancelLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Button asChild variant="outline" className={`${dialogButtonClass} bg-card`}>
        <Link href={closeHref} replace scroll={false}>
          {cancelLabel}
        </Link>
      </Button>
      {children}
    </div>
  );
}
