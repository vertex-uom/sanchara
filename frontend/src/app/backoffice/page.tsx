import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCompanyProperties } from "@/features/properties";
import { getCurrentStaff } from "@/lib/auth/current-staff";
import { propertyPath } from "@/lib/routes/backoffice";

export const metadata = { title: "Back Office" };

// Back Office home, also where sign-in lands: each user goes to their own
// company's dashboard (its first property). Signed-out visitors go to the
// sign-in page of their portal (getCurrentStaff).
export default function Page() {
  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-dvh items-center justify-center bg-office-sidebar px-4 outline-none">
      <Suspense fallback={<p className="text-sm text-office-muted">Opening your dashboard…</p>}>
        <OpenDashboard />
      </Suspense>
    </main>
  );
}

async function OpenDashboard() {
  await getCurrentStaff();
  const [first] = await getCompanyProperties();
  if (first) redirect(propertyPath(first.id));

  return (
    <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
      <h1 className="text-xl font-semibold">No property yet</h1>
      <p className="mt-2 text-sm text-office-muted">Your company doesn&apos;t have a property set up. Contact the Sanchara team to add one.</p>
    </div>
  );
}
