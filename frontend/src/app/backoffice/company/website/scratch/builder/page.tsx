import { getCompanyProperties } from "@/features/properties";
import { SiteBuilder, siteFontVariables } from "@/features/website-builder";

export const metadata = { title: "Build Page · Website Builder" };

// "Start from scratch", step 3: the page builder, full screen.
export default async function Page() {
  const [property] = await getCompanyProperties();
  return (
    <div className={`${siteFontVariables} flex-1`}>
      <SiteBuilder hotelName={property?.name ?? "Your Hotel"} />
    </div>
  );
}
