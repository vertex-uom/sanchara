import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

type StaffHeaderProps = {
  place?: { name: string; location: string };
  addHref: string;
  limitReached: boolean;
};

const addClass = "h-11 gap-2 rounded-lg px-4 text-base font-semibold md:h-10";

// At the plan limit "Add staff" is disabled and says why.
export function StaffHeader({ place, addHref, limitReached }: StaffHeaderProps) {
  return (
    <PageHeader
      title="Staff Management"
      place={place}
      action={
        limitReached ? (
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <Button variant="office" disabled aria-describedby="staff-limit-note" className={addClass}>
              <Plus aria-hidden="true" className="size-5" />
              Add staff
            </Button>
            <p id="staff-limit-note" className="text-sm text-office-muted">
              Your plan&apos;s staff limit is reached.
            </p>
          </div>
        ) : (
          <Button asChild variant="office" className={addClass}>
            <Link href={addHref} scroll={false}>
              <Plus aria-hidden="true" className="size-5" />
              Add staff
            </Link>
          </Button>
        )
      }
    />
  );
}
