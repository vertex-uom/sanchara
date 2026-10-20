import { Suspense } from "react";
import { Placeholder } from "@/components/shell/placeholder";
import { requireGuest } from "@/lib/auth/guest";

export default function Page() {
  return (
    <Suspense>
      <Bookings />
    </Suspense>
  );
}

async function Bookings() {
  await requireGuest("/account/bookings");
  return <Placeholder title="My bookings" notes="Bookings from all companies." />;
}
