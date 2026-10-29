import { RemoteImage } from "@/components/ui/remote-image";
import type { UnitAvailability } from "../types";
import { UnitStatusBadge } from "./unit-status-badge";

const PLACEHOLDER_PHOTO = "/images/room-placeholder.jpg";

type UnitCardProps = {
  availability: UnitAvailability;
  // "Deluxe", shown before the guest limit.
  roomTypeName: string;
};

// One unit in the results: photo, name, room type and guest limit, status.
export function UnitCard({ availability, roomTypeName }: UnitCardProps) {
  const { unit } = availability;

  return (
    <article className="flex w-full flex-col rounded-[12px] border border-border bg-card p-2">
      <RemoteImage
        src={unit.photoUrl ?? PLACEHOLDER_PHOTO}
        alt=""
        width={480}
        height={300}
        className="aspect-16/10 w-full rounded-lg object-cover"
      />
      <h4 className="mt-2 text-sm font-bold text-foreground">{unit.name}</h4>
      <p className="text-xs text-office-muted">
        {roomTypeName}
        <span aria-hidden="true" className="mx-1">
          •
        </span>
        <span className="sr-only">, </span>
        Max {unit.maxGuests} {unit.maxGuests === 1 ? "guest" : "guests"}
      </p>
      <UnitStatusBadge availability={availability} className="mt-2" />
    </article>
  );
}
