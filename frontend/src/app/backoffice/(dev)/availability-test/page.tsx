import { notFound } from "next/navigation";
import { AvailabilityTest } from "./availability-test";

// THROWAWAY dev page for the availability foundation. Delete once the real
// page is built. Not served in production.
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <AvailabilityTest />;
}
