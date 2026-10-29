import { Suspense } from "react";
import { Skeleton } from "@/components/ui/widget";
import { getCompanyProperties } from "@/features/properties";
import { ScratchReview, siteFontVariables } from "@/features/website-builder";

export const metadata = { title: "Review Website · Website Builder" };

// "Start from scratch", step 4: review the built site before publishing.
export default function Page() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={`${siteFontVariables} flex-1 outline-none`}
    >
      <Suspense fallback={<Skeleton className="min-h-dvh w-full rounded-none" />}>
        <Review />
      </Suspense>
    </main>
  );
}

async function Review() {
  const [property] = await getCompanyProperties();
  return (
    <ScratchReview
      hotelName={property?.name ?? "Your Hotel"}
      location={property ? `${property.town}, ${property.country}` : ""}
    />
  );
}
