import { Suspense } from "react";
import { Placeholder } from "@/components/shell/placeholder";
import { requireGuest } from "@/lib/auth/guest";

type BookingProps = Pick<PageProps<"/central/account/bookings/[bookingId]">, "params">;

export default function Page({ params }: BookingProps) {
  return (
    <Suspense>
      <Booking params={params} />
    </Suspense>
  );
}

async function Booking({ params }: BookingProps) {
  const { bookingId } = await params;
  await requireGuest(`/account/bookings/${encodeURIComponent(bookingId)}`);
  return <Placeholder title="Booking" notes="Request cancellation links to WhatsApp/phone only; changes nothing." />;
}
