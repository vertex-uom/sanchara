import { getCompanyProperties } from "@/features/properties";
import {
  AssistanceTracker,
  getAssistanceProgress,
} from "@/features/website-builder";
import { propertyPath } from "@/lib/routes/backoffice";

export const metadata = { title: "Website Request · WEMIXT Assistance" };

// Tracking page for a WEMIXT assistance request.
export default async function Page() {
  const [[property], progress] = await Promise.all([
    getCompanyProperties(),
    getAssistanceProgress(),
  ]);
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative isolate min-h-dvh flex-1 overflow-hidden bg-[#f4f9fb] px-4 py-6 outline-none sm:px-6 lg:px-8 xl:px-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 -z-10 size-[30rem] rounded-full bg-office-chart-fill/70 blur-3xl"
      />
      <AssistanceTracker
        propertyName={property?.name ?? ""}
        dashboardHref={property ? propertyPath(property.id) : "/"}
        progress={progress}
      />
    </main>
  );
}
