import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChipLink } from "@/components/ui/chip-link";
import { PageHeader } from "@/components/ui/page-header";
import { RATES_TABS, type RatesTab } from "../config";

const actionClass = "h-11 gap-2 rounded-lg px-4 text-base font-semibold md:h-10";

type RatesHeaderProps = { propertyName: string; addSeasonHref: string; addPlanHref: string };

export function RatesHeader({ propertyName, addSeasonHref, addPlanHref }: RatesHeaderProps) {
  return (
    <PageHeader
      title="Rates & Seasons"
      description={propertyName}
      action={
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="office" className={actionClass}>
            <Link href={addSeasonHref} scroll={false}>
              <Plus aria-hidden="true" className="size-5" />
              Add season
            </Link>
          </Button>
          <Button asChild variant="office" className={actionClass}>
            <Link href={addPlanHref} scroll={false}>
              <Plus aria-hidden="true" className="size-5" />
              Add rate plan
            </Link>
          </Button>
        </div>
      }
    />
  );
}

// Each tab is a link (it changes the URL), so this is a nav, not an ARIA tablist.
export function RatesTabs({ active, hrefFor }: { active: RatesTab; hrefFor: (tab: RatesTab) => string }) {
  return (
    <nav aria-label="Rates and seasons" className="-mx-4 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2">
        {RATES_TABS.map(({ key, label }) => (
          <li key={key}>
            <ChipLink href={hrefFor(key)} active={key === active} current="page" size="sm">
              {label}
            </ChipLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
