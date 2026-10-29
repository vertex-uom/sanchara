import { StaffSuspendedPage } from "@/features/staff-auth";

export const metadata = { title: "Account suspended" };

// Notice for a suspended company's Managers and Front Desk.
export default function Page() {
  return <StaffSuspendedPage />;
}
