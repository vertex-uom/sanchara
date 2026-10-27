import { getCompanyProperties } from "@/features/properties";
import {
  ScratchWebsitePublished,
  siteFontVariables,
} from "@/features/website-builder";
import { propertyPath } from "@/lib/routes/backoffice";

export const metadata = { title: "Website Published · Website Builder" };

// Shown after publishing a site built from scratch: share its link.
export default async function Page() {
  const [property] = await getCompanyProperties();
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={`${siteFontVariables} relative isolate flex min-h-dvh flex-1 items-center overflow-hidden bg-[#f4f9fb] px-4 py-10 outline-none sm:px-8 lg:px-12`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 -z-10 size-[32rem] rounded-full bg-office-chart-fill blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -left-40 -z-10 size-[30rem] rounded-full bg-office-chart-fill/70 blur-3xl"
      />
      <ScratchWebsitePublished
        hotelName={property?.name ?? "Your Hotel"}
        dashboardHref={property ? propertyPath(property.id) : "/"}
      />
    </main>
  );
}
