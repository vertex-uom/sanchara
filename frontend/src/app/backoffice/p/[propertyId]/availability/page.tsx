import { Suspense } from "react";
import { notFound } from "next/navigation";
import { can } from "@/lib/auth/permissions";
import { getCurrentStaff } from "@/lib/auth/staff";
import { AvailabilitySkeleton, AvailabilityWorkspace } from "@/features/availability";
import { getCompanyProperties } from "@/features/properties";

export const metadata = { title: "Availability & Date Blocks" };

type AvailabilityProps = Pick<PageProps<"/backoffice/p/[propertyId]/availability">, "params">;

// Check which units are free for a stay, and manage date blocks.
export default function Page({ params }: PageProps<"/backoffice/p/[propertyId]/availability">) {
  return (
    <main id="main-content" tabIndex={-1} className="flex flex-col gap-5 px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-6">
      <Suspense fallback={<AvailabilitySkeleton />}>
        <Availability params={params} />
      </Suspense>
    </main>
  );
}

async function Availability({ params }: AvailabilityProps) {
  const [{ propertyId }, user, properties] = await Promise.all([params, getCurrentStaff(), getCompanyProperties()]);
  const property = properties.find((item) => item.id === propertyId);
  if (!property) notFound();

  return (
    <AvailabilityWorkspace
      place={{ name: property.name, location: `${property.town}, ${property.country}` }}
      canManageBlocks={can(user, "blocks.manage")}
    />
  );
}
