import { BedDouble, Box, Layers, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/widget";
import type { RoomStats } from "../types";

const CARDS: { key: keyof RoomStats; label: string; icon: LucideIcon }[] = [
  { key: "roomTypes", label: "Room types", icon: BedDouble },
  { key: "units", label: "Units", icon: Box },
  { key: "activeUnits", label: "Active units", icon: Layers },
];

// Three equal cards: room types, units, active units. 1 column on phones.
// `unavailable` (load failed) shows a dash instead of a misleading 0.
export function StatCards({ stats, loading, unavailable = false }: { stats: RoomStats; loading: boolean; unavailable?: boolean }) {
  return (
    <section aria-labelledby="room-stats-title">
      <h2 id="room-stats-title" className="sr-only">
        Summary
      </h2>
      <ul className="grid gap-4 @lg:grid-cols-3">
        {CARDS.map(({ key, label, icon: Icon }) => (
          <li key={key} className="flex items-center gap-3 rounded-[12px] border border-border bg-card p-4 @3xl:gap-4">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-aqua text-brand-tropical @3xl:size-12">
              <Icon aria-hidden="true" className="size-6" strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <p className="text-sm whitespace-nowrap text-office-muted">{label}</p>
              {loading ? (
                <Skeleton className="mt-1 h-8 w-10" />
              ) : unavailable ? (
                <p className="text-2xl font-bold text-office-muted">
                  <span aria-hidden="true">–</span>
                  <span className="sr-only">Not available</span>
                </p>
              ) : (
                <p className="text-2xl font-bold text-foreground">{stats[key]}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
