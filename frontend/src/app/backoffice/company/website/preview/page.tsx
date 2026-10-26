import { getCompanyProperties } from "@/features/properties";
import { WebsitePreview } from "@/features/website-builder";

export const metadata = { title: "Preview Your Website · Website Builder" };

// Full-screen preview of the hotel template site. The name, city and country
// start from the company's first property until the template steps are saved.
export default async function Page() {
  const [property] = await getCompanyProperties();
  return (
    <WebsitePreview
      hotelName={property?.name ?? "Your Hotel"}
      city={property?.town ?? ""}
      country={property?.country ?? ""}
    />
  );
}
