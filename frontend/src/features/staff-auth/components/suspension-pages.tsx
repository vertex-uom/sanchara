import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSignedInStaff, isSuspended, suspendedPath } from "@/lib/auth/current-staff";
import { SuspendedNotice } from "./suspended-notice";

// /billing (the Owner) and /suspended (everyone else) for a suspended company.
// Anyone who doesn't belong on the page goes back to the Back Office home.

export function OwnerBillingPage() {
  return (
    <Suspense fallback={null}>
      <OwnerBilling />
    </Suspense>
  );
}

async function OwnerBilling() {
  const user = await getSignedInStaff();
  if (!isSuspended(user.company)) redirect("/");
  if (suspendedPath(user) !== "/billing") redirect(suspendedPath(user));
  const byAdmin = user.company.status === "suspended-by-admin";

  return (
    <SuspendedNotice title={`${user.company.name} is suspended`}>
      {byAdmin ? (
        <p>The Sanchara team suspended your company&apos;s account. Your staff can&apos;t use the Back Office until it is reactivated.</p>
      ) : (
        <p>Your subscription payment didn&apos;t go through, so your company&apos;s account is suspended. Your staff can&apos;t use the Back Office until it is paid.</p>
      )}
      <p>
        {byAdmin
          ? "Contact the Sanchara team to find out why and what to do next."
          : "Online payment isn't available yet: contact the Sanchara team to pay and restore access."}{" "}
        Your website and bookings data are kept.
      </p>
    </SuspendedNotice>
  );
}

export function StaffSuspendedPage() {
  return (
    <Suspense fallback={null}>
      <StaffSuspended />
    </Suspense>
  );
}

async function StaffSuspended() {
  const user = await getSignedInStaff();
  if (!isSuspended(user.company)) redirect("/");
  if (suspendedPath(user) !== "/suspended") redirect(suspendedPath(user));

  return (
    <SuspendedNotice title="Your company's account is suspended">
      <p>You can&apos;t use the Back Office for {user.company.name} right now.</p>
      <p>Your Owner has been told what to do. Ask them when access will be restored.</p>
    </SuspendedNotice>
  );
}
