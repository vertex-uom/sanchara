import Link from "next/link";
import { CalendarRange, Pencil, Trash2 } from "lucide-react";
import { DAY_MS, formatDateOnly } from "@/lib/format/dates";
import { EmptyState, FlatCard } from "@/components/ui/widget";
import { seasonRange } from "../season-label";
import type { Season } from "../types";

const linkClass = "focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium md:min-h-9";

type SeasonsListProps = { seasons: Season[]; editHref: (seasonId: string) => string; deleteHref: (seasonId: string) => string };

// Seasons in date order. Dates outside every season use the base rate.
export function SeasonsList({ seasons, editHref, deleteHref }: SeasonsListProps) {
  return (
    <FlatCard aria-labelledby="seasons-title" className="flex flex-col gap-4">
      <div>
        <h2 id="seasons-title" className="text-lg font-semibold">
          Seasons
        </h2>
        <p className="mt-0.5 text-sm text-office-muted">Each season gets its own column on the Rates tab. Dates outside every season use the base rate.</p>
      </div>
      {seasons.length === 0 ? (
        <EmptyState>No seasons yet. Every date uses the base rate.</EmptyState>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {seasons.map((season) => {
            const days = Math.round((Date.parse(season.to) - Date.parse(season.from)) / DAY_MS) + 1;
            return (
              <li key={season.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-office-tint-teal">
                  <CalendarRange className="size-4.5 text-office-primary" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{season.name}</p>
                  <p className="text-xs text-office-muted">
                    {formatDateOnly(season.from)} – {formatDateOnly(season.to)} · {seasonRange(season.from, season.to)} · {days} day{days === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Link href={editHref(season.id)} scroll={false} className={`${linkClass} text-office-link hover:bg-office-nav-active`}>
                    <Pencil aria-hidden="true" className="size-4" />
                    Edit<span className="sr-only"> {season.name}</span>
                  </Link>
                  <Link href={deleteHref(season.id)} scroll={false} className={`${linkClass} text-office-danger hover:bg-office-danger-soft`}>
                    <Trash2 aria-hidden="true" className="size-4" />
                    Delete<span className="sr-only"> {season.name}</span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </FlatCard>
  );
}
