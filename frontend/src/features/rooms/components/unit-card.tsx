import { User } from "lucide-react";
import { RemoteImage } from "@/components/ui/remote-image";
import { cn } from "@/lib/utils";
import { INACTIVE_CARD, SELECTED_CARD } from "../status-tokens";
import type { RoomUnit } from "../types";
import { UnitStatusBadge } from "./unit-status-badge";

const PLACEHOLDER_PHOTO = "/images/room-placeholder.jpg";

type UnitCardProps = {
  unit: RoomUnit;
  selected: boolean;
  // Makes the card a button; left out when the viewer can't edit units.
  onSelect?: (unitId: string) => void;
};

// One unit: photo, name, guest limit, status. Horizontal layout.
export function UnitCard({ unit, selected, onSelect }: UnitCardProps) {
  const content = (
    <>
      <RemoteImage
        src={unit.photoUrl ?? PLACEHOLDER_PHOTO}
        alt=""
        width={160}
        height={128}
        className={cn("size-16 shrink-0 rounded-lg object-cover", !unit.isActive && INACTIVE_CARD.photo)}
      />
      <span className="flex min-w-0 flex-col items-start gap-1">
        <span className="truncate text-sm font-bold text-foreground">{unit.name}</span>
        <span className="flex items-center gap-1 text-xs text-office-muted">
          <User aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.75} />
          Max {unit.maxGuests} {unit.maxGuests === 1 ? "guest" : "guests"}
        </span>
        <UnitStatusBadge isActive={unit.isActive} />
      </span>
    </>
  );

  const cardClass = cn(
    "flex w-full items-center gap-3 rounded-[12px] border border-border p-3 text-left",
    unit.isActive ? "bg-card" : INACTIVE_CARD.card,
    selected && SELECTED_CARD,
  );

  if (!onSelect) return <div className={cardClass}>{content}</div>;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(unit.id)}
      className={cn(cardClass, "focus-ring cursor-pointer transition-colors hover:border-brand-lagoon motion-reduce:transition-none")}
    >
      {content}
    </button>
  );
}
