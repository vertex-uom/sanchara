import { Suspense } from "react";
import { Skeleton } from "@/components/ui/widget";
import { getCompanyProperties } from "@/features/properties";
import { WebsiteHome } from "@/features/website-builder";

export const metadata = { title: "Website Builder" };

// Start screen until the website is published, then the website dashboard
// (Owner and Manager, like the other company pages).
export default function Page() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative isolate flex flex-1 flex-col px-4 py-8 outline-none sm:px-6 lg:px-8 lg:py-10 xl:px-12"
    >
      <Suspense fallback={<Skeleton className="h-128 w-full rounded-2xl" />}>
        <Home />
      </Suspense>
    </main>
  );
}

async function Home() {
  const [property] = await getCompanyProperties();
  return (
    <WebsiteHome
      hotelName={property?.name ?? "Your Hotel"}
      city={property?.town ?? ""}
      country={property?.country ?? ""}
    />
  );
}
