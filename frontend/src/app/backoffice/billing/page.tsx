import { OwnerBillingPage } from "@/features/staff-auth";

export const metadata = { title: "Billing" };

// The only page a suspended company's Owner can reach.
export default function Page() {
  return <OwnerBillingPage />;
}
