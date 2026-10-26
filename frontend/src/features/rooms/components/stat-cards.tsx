import { BedDouble, Box, Layers, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/widget";
import type { RoomStats } from "../types";

const CARDS: { key: keyof RoomStats; label: string; icon: LucideIcon }[] = [
  { key: "roomTypes", label: "Room types", icon: BedDouble },
  { key: "units", label: "Units", icon: Box },
  { key: "activeUnits", label: "Active units", icon: Layers },
];

// Three equal cards: room types, units, active units. 1 column on phones.
export function StatCards({ stats, loading }: { stats: RoomStats; loading: boolean }) {
  return (
    <section aria-labelledby="room-stats-title">
      <h2 id="room-stats-title" className="sr-only">
        Summary
      </h2>
      <ul className="grid gap-4 sm:grid-cols-3">
        {CARDS.map(({ key, label, icon: Icon }) => (
          <li key={key} className="flex items-center gap-4 rounded-[12px] border border-border bg-card p-4">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-aqua text-brand-tropical">
              <Icon aria-hidden="true" className="size-6" strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-office-muted">{label}</p>
              {loading ? (
                <Skeleton className="mt-1 h-8 w-10" />
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
