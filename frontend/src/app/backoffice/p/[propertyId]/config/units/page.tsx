import { RoomsPage } from "@/features/rooms";

export const metadata = { title: "Rooms & Units" };

// Same page as config/room-types (the sidebar's Rooms & Units link).
export default function Page({ params }: PageProps<"/backoffice/p/[propertyId]/config/units">) {
  return <RoomsPage propertyId={params.then((p) => p.propertyId)} />;
}
