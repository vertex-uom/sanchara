import { getCompanyProperties } from "@/features/properties";
import { AssistanceSent } from "@/features/website-builder";
import { propertyPath } from "@/lib/routes/backoffice";

export const metadata = { title: "Request Sent · WEMIXT Assistance" };

// Confirmation after sending a WEMIXT assistance request.
export default async function Page() {
  const [property] = await getCompanyProperties();
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative isolate flex min-h-dvh flex-1 items-center justify-center overflow-hidden bg-[#f4f9fb] px-4 py-10 outline-none"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 -z-10 size-[32rem] rounded-full bg-office-chart-fill blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -left-40 -z-10 size-[30rem] rounded-full bg-office-chart-fill/70 blur-3xl"
      />
      <AssistanceSent
        propertyName={property?.name ?? ""}
        dashboardHref={property ? propertyPath(property.id) : "/"}
      />
    </main>
  );
}
