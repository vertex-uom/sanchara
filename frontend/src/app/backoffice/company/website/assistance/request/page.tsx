import { Suspense } from "react";
import { Skeleton } from "@/components/ui/widget";
import { getCompanyProperties } from "@/features/properties";
import { AssistanceDetails } from "@/features/website-builder";
import { propertyPath } from "@/lib/routes/backoffice";

export const metadata = { title: "Request Details · WEMIXT Assistance" };

// What the owner sent to WEMIXT, with edit and cancel.
export default function Page() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative isolate min-h-dvh flex-1 overflow-hidden bg-[#f4f9fb] px-4 py-6 outline-none sm:px-6 lg:px-8 xl:px-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 -z-10 size-120 rounded-full bg-office-chart-fill/70 blur-3xl"
      />
      <Suspense fallback={<Skeleton className="h-128 w-full rounded-2xl" />}>
        <Details />
      </Suspense>
    </main>
  );
}

async function Details() {
  const [property] = await getCompanyProperties();
  return (
    <AssistanceDetails
      propertyName={property?.name ?? ""}
      dashboardHref={property ? propertyPath(property.id) : "/"}
    />
  );
}
