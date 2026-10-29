import { Suspense } from "react";
import { Skeleton } from "@/components/ui/widget";
import { getCompanyProperties } from "@/features/properties";
import {
  ContactSocialForm,
  TemplateFormShell,
} from "@/features/website-builder";

export const metadata = { title: "Contact & Social · Website Builder" };

// Hotel template, step 6: address, contact details, social links and pages.
// City and country start from the company's first property.
export default function Page() {
  return (
    <TemplateFormShell
      step={6}
      title="Contact & Social"
      description="Add your address, contact numbers and social media links so guests can reach you."
    >
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <Contact />
      </Suspense>
    </TemplateFormShell>
  );
}

async function Contact() {
  const [property] = await getCompanyProperties();
  return (
    <ContactSocialForm
      hotelName={property?.name ?? ""}
      city={property?.town ?? ""}
      country={property?.country ?? ""}
    />
  );
}
