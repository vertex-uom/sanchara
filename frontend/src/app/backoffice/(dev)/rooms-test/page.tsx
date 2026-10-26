import { notFound } from "next/navigation";
import { RoomsTest } from "./rooms-test";

// THROWAWAY dev page for the Rooms & Units foundation. Delete once the real
// page is built. Not served in production.
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <RoomsTest />;
}
