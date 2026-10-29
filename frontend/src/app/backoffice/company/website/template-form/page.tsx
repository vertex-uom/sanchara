import { Suspense } from "react";
import { Skeleton } from "@/components/ui/widget";
import { getCompanyProperties } from "@/features/properties";
import {
  HotelDetailsForm,
  TemplateFormShell,
} from "@/features/website-builder";

export const metadata = { title: "Hotel Details · Website Builder" };

// Hotel template, step 1: basic details. The hotel name starts from the
// company's first property, like the shell's property switcher.
export default function Page() {
  return (
    <TemplateFormShell
      step={1}
      title="Hotel Details"
      description="Tell us about your property. Every client fills in the same form, and we place your details into our template."
    >
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <Details />
      </Suspense>
    </TemplateFormShell>
  );
}

async function Details() {
  const [property] = await getCompanyProperties();
  return <HotelDetailsForm hotelName={property?.name ?? ""} />;
}
