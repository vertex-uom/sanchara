import { getCompanyProperties } from "@/features/properties";
import { ScratchReview, siteFontVariables } from "@/features/website-builder";

export const metadata = { title: "Review Website · Website Builder" };

// "Start from scratch", step 4: review the built site before publishing.
export default async function Page() {
  const [property] = await getCompanyProperties();
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={`${siteFontVariables} flex-1 outline-none`}
    >
      <ScratchReview
        hotelName={property?.name ?? "Your Hotel"}
        location={property ? `${property.town}, ${property.country}` : ""}
      />
    </main>
  );
}
