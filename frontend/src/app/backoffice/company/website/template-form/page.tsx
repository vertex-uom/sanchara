import { getCompanyProperties } from "@/features/properties";
import {
  HotelDetailsForm,
  TemplateFormShell,
} from "@/features/website-builder";

export const metadata = { title: "Hotel Details · Website Builder" };

// Hotel template, step 1: basic details. The hotel name starts from the
// company's first property, like the shell's property switcher.
export default async function Page() {
  const [property] = await getCompanyProperties();
  return (
    <TemplateFormShell
      step={1}
      stepLabel="Step 1 of 6"
      title="Hotel Details"
      description="Tell us about your property. Every client fills in the same form, and we place your details into our template."
    >
      <HotelDetailsForm hotelName={property?.name ?? ""} />
    </TemplateFormShell>
  );
}
