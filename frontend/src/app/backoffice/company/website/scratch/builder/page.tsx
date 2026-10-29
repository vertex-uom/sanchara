import { Suspense } from "react";
import { Skeleton } from "@/components/ui/widget";
import { getCompanyProperties } from "@/features/properties";
import { getWebsiteStatus } from "@/features/website";
import { SiteBuilder, siteFontVariables } from "@/features/website-builder";

export const metadata = { title: "Build Page · Website Builder" };

// "Start from scratch", step 3: the page builder, full screen.
export default function Page() {
  return (
    <div className={`${siteFontVariables} flex-1`}>
      <Suspense fallback={<Skeleton className="min-h-dvh w-full rounded-none" />}>
        <Builder />
      </Suspense>
    </div>
  );
}

async function Builder() {
  const [[property], website] = await Promise.all([
    getCompanyProperties(),
    getWebsiteStatus(),
  ]);
  return (
    <SiteBuilder
      hotelName={property?.name ?? "Your Hotel"}
      bookingEngine={website.bookingEngine}
    />
  );
}
