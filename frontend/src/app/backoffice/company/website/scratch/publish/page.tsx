import { getCompanyProperties } from "@/features/properties";
import { ScratchPublishSettings } from "@/features/website-builder";

export const metadata = { title: "Publish Settings · Website Builder" };

// "Start from scratch", step 5: web address, search text and publish.
export default async function Page() {
  const [property] = await getCompanyProperties();
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative isolate flex-1 overflow-hidden px-4 py-6 outline-none sm:px-6 lg:px-8 xl:px-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 -z-10 size-[28rem] rounded-full bg-office-chart-fill/70 blur-3xl"
      />
      <ScratchPublishSettings
        hotelName={property?.name ?? "Your Hotel"}
        city={property?.town ?? ""}
      />
    </main>
  );
}
