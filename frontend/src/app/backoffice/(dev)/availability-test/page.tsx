import { notFound } from "next/navigation";
import { AvailabilityTest } from "./availability-test";
import { StatusCards } from "./status-cards";

// THROWAWAY dev page for the availability foundation. Delete once the real
// page is built. Not served in production.
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="space-y-6 p-6">
      <StatusCards />
      <AvailabilityTest />
    </div>
  );
}
