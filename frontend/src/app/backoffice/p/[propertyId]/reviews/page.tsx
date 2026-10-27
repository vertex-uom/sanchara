import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCompanyProperties } from "@/features/properties";
import { ReviewsSkeleton, ReviewsWorkspace } from "@/features/reviews";

export const metadata = { title: "Reviews" };

type ReviewsProps = Pick<PageProps<"/backoffice/p/[propertyId]/reviews">, "params">;

// Guest reviews of the property. Read-only: reviews are public and come from
// verified stays; staff can't reply to or hide them.
export default function Page({ params }: PageProps<"/backoffice/p/[propertyId]/reviews">) {
  return (
    <main id="main-content" tabIndex={-1} className="flex flex-col gap-5 px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-6">
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews params={params} />
      </Suspense>
    </main>
  );
}

async function Reviews({ params }: ReviewsProps) {
  const [{ propertyId }, properties] = await Promise.all([params, getCompanyProperties()]);
  const property = properties.find((item) => item.id === propertyId);
  if (!property) notFound();

  return <ReviewsWorkspace propertyId={propertyId} place={{ name: property.name, location: `${property.town}, ${property.country}` }} />;
}
