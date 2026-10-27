import { getCompanyProperties } from "@/features/properties";
import {
  ContactSocialForm,
  TemplateFormShell,
} from "@/features/website-builder";

export const metadata = { title: "Contact & Social · Website Builder" };

// Hotel template, step 6: address, contact details, social links and pages.
// City and country start from the company's first property.
export default async function Page() {
  const [property] = await getCompanyProperties();
  return (
    <TemplateFormShell
      step={6}
      title="Contact & Social"
      description="Add your address, contact numbers and social media links so guests can reach you."
    >
      <ContactSocialForm
        hotelName={property?.name ?? ""}
        city={property?.town ?? ""}
        country={property?.country ?? ""}
      />
    </TemplateFormShell>
  );
}
