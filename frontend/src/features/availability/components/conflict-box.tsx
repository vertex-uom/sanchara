import { CircleAlert } from "lucide-react";
import { RemoteImage } from "@/components/ui/remote-image";
import { cn } from "@/lib/utils";
import { BLOCK_CONFLICT_BEHAVIOUR } from "../constants";
import { formatDateRange } from "../results";
import { CONFLICT_BOX, CONFLICT_STATUS_TOKENS } from "../status-tokens";
import type { BlockConflict, PropertyUnits } from "../types";

const PLACEHOLDER_PHOTO = "/images/room-placeholder.jpg";

type ConflictBoxProps = {
  conflicts: BlockConflict[];
  // For each conflict's room type and photo.
  propertyUnits: PropertyUnits | null;
};

function countLabel(count: number) {
  return `${count} ${count === 1 ? "conflict" : "conflicts"} found`;
}

// Reservations, holds and blocks the new block would overlap. The live
// region is always rendered so the count is announced when it appears.
export function ConflictBox({ conflicts, propertyUnits }: ConflictBoxProps) {
  const count = conflicts.length;

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {count > 0 ? countLabel(count) : ""}
      </p>
      {count > 0 ? (
        <section aria-labelledby="block-conflicts-title" className={cn("rounded-[12px] p-3", CONFLICT_BOX.container)}>
          <h3 id="block-conflicts-title" className={cn("flex items-center gap-2 text-sm font-bold", CONFLICT_BOX.title)}>
            <CircleAlert aria-hidden="true" className={cn("size-4 shrink-0", CONFLICT_BOX.icon)} />
            {countLabel(count)}
          </h3>
          <p className="mt-1.5 text-xs text-office-label">The selected dates overlap with existing reservations or holds.</p>

          <ul className="mt-3 flex flex-col gap-2">
            {conflicts.map((conflict) => {
              const unit = propertyUnits?.units.find((u) => u.id === conflict.unitId);
              const roomType = propertyUnits?.roomTypes.find((t) => t.id === unit?.roomTypeId);
              const status = CONFLICT_STATUS_TOKENS[conflict.status];
              const StatusIcon = status.icon;
              return (
                <li key={conflict.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-2">
                  <RemoteImage
                    src={unit?.photoUrl ?? PLACEHOLDER_PHOTO}
                    alt=""
                    width={96}
                    height={60}
                    className="size-12 shrink-0 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {conflict.guestName ?? (conflict.kind === "block" ? "Date block" : "Reservation")}
                    </p>
                    <p className="text-xs text-office-muted">
                      {conflict.unitName}
                      {roomType ? (
                        <>
                          <span aria-hidden="true" className="mx-1">
                            •
                          </span>
                          <span className="sr-only">, </span>
                          {roomType.name}
                        </>
                      ) : null}
                    </p>
                    <p className="text-xs text-office-muted">{formatDateRange(conflict.from, conflict.to)}</p>
                  </div>
                  <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium", status.pill)}>
                    <StatusIcon aria-hidden="true" className="size-3.5" />
                    {status.label}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* With BLOCK_CONFLICT_BEHAVIOUR "warn" the block can still be saved, so no line is shown. */}
          {BLOCK_CONFLICT_BEHAVIOUR === "prevent" ? (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-office-danger-text">
              <CircleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              Block cannot be created while there are conflicts.
            </p>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
