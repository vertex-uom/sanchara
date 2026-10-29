import { Suspense } from "react";
import { notFound } from "next/navigation";
import { can } from "@/lib/auth/permissions";
import { getCurrentStaff } from "@/lib/auth/current-staff";
import { getCompanyProperties } from "@/features/properties";
import { RoomsSkeleton } from "./rooms-skeleton";
import { RoomsWorkspace } from "./rooms-workspace";

// The Rooms & Units page body. Rendered by both config/room-types (the
// sidebar link) and config/units, so either URL shows the same page.
export function RoomsPage({ propertyId }: { propertyId: Promise<string> }) {
  return (
    <main id="main-content" tabIndex={-1} className="flex flex-col gap-5 px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-6">
      <Suspense fallback={<RoomsSkeleton />}>
        <Rooms propertyId={propertyId} />
      </Suspense>
    </main>
  );
}

async function Rooms({ propertyId: propertyIdPromise }: { propertyId: Promise<string> }) {
  const [propertyId, user, properties] = await Promise.all([propertyIdPromise, getCurrentStaff(), getCompanyProperties()]);
  const property = properties.find((item) => item.id === propertyId);
  if (!property) notFound();

  return (
    <RoomsWorkspace
      propertyId={propertyId}
      place={{ name: property.name, location: `${property.town}, ${property.country}` }}
      canManageRooms={can(user, "rooms.manage")}
    />
  );
}
