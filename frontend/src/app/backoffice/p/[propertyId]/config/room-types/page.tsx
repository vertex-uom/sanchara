import { RoomsPage } from "@/features/rooms";

export const metadata = { title: "Rooms & Units" };

// Rooms & Units: room types and the named units guests book. The sidebar
// links here; config/units shows the same page.
export default function Page({ params }: PageProps<"/backoffice/p/[propertyId]/config/room-types">) {
  return <RoomsPage propertyId={params.then((p) => p.propertyId)} />;
}
