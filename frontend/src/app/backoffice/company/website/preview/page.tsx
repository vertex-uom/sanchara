import { Suspense } from "react";
import { Skeleton } from "@/components/ui/widget";
import { getCompanyProperties } from "@/features/properties";
import { WebsitePreview } from "@/features/website-builder";

export const metadata = { title: "Preview Your Website · Website Builder" };

// Full-screen preview of the hotel template site. The name, city and country
// start from the company's first property until the template steps are saved.
export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="min-h-dvh w-full rounded-none" />}>
      <Preview />
    </Suspense>
  );
}

async function Preview() {
  const [property] = await getCompanyProperties();
  return (
    <WebsitePreview
      hotelName={property?.name ?? "Your Hotel"}
      city={property?.town ?? ""}
      country={property?.country ?? ""}
    />
  );
}
