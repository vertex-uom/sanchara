import { Suspense } from "react";
import { BedDouble, CircleAlert, PlaneLanding, PlaneTakeoff, Users, type LucideIcon } from "lucide-react";
import { formatCount } from "@/lib/format/numbers";
import { propertyPath } from "@/lib/routes/backoffice";
import { Skeleton, WidgetCard, WidgetHeader, WidgetLink } from "@/components/ui/widget";
import { getTodayAtAGlance } from "../server/today";
import type { TodayAtAGlance as TodayCounts } from "../types";

type Tile = { key: keyof TodayCounts; label: string; icon: LucideIcon; href: string };

function tiles(propertyId: string): Tile[] {
  return [
    { key: "arrivals", label: "Arrivals", icon: PlaneLanding, href: propertyPath(propertyId, "reservations?view=arrivals") },
    { key: "departures", label: "Departures", icon: PlaneTakeoff, href: propertyPath(propertyId, "reservations?view=departures") },
    { key: "inHouse", label: "In-house", icon: Users, href: propertyPath(propertyId, "reservations?view=in-house") },
    { key: "unitsAvailableTonight", label: "Units available tonight", icon: BedDouble, href: propertyPath(propertyId, "availability") },
    { key: "noShows", label: "No-shows", icon: CircleAlert, href: propertyPath(propertyId, "reservations?view=no-shows") },
  ];
}

export function TodayAtAGlance({ propertyId }: { propertyId: string }) {
  return (
    <WidgetCard aria-labelledby="today-title">
      <WidgetHeader
        id="today-title"
        title="Today at a glance"
        action={
          <WidgetLink href={propertyPath(propertyId, "calendar")} srContext="in the reservations calendar">
            View all
          </WidgetLink>
        }
      />
      <Suspense fallback={<TodaySkeleton />}>
        <TodayTiles propertyId={propertyId} />
      </Suspense>
    </WidgetCard>
  );
}

async function TodayTiles({ propertyId }: { propertyId: string }) {
  const counts = await getTodayAtAGlance(propertyId);
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {tiles(propertyId).map(({ key, label, icon: Icon, href }) => (
        <li key={key} className="flex flex-col rounded-xl border border-brand-lagoon/50 p-3 sm:p-4">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 flex items-center gap-2">
            <Icon aria-hidden="true" className="size-6 shrink-0 text-brand-teal" />
            <span className="text-2xl font-semibold">{formatCount(counts[key])}</span>
          </p>
          <WidgetLink href={href} srContext={label.toLowerCase()} className="mt-auto">
            View all
          </WidgetLink>
        </li>
      ))}
    </ul>
  );
}

function TodaySkeleton() {
  return (
    <div aria-busy="true" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      <span className="sr-only">Loading today&apos;s counts</span>
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-28 rounded-xl" />
      ))}
    </div>
  );
}
