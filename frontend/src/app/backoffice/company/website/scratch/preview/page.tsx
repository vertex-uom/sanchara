import { getCompanyProperties } from "@/features/properties";
import {
  ScratchWebsitePreview,
  siteFontVariables,
} from "@/features/website-builder";

export const metadata = { title: "Preview Your Website · Website Builder" };

// "Start from scratch": full-screen preview of the built site.
export default async function Page() {
  const [property] = await getCompanyProperties();
  return (
    <div className={`${siteFontVariables} flex flex-1 flex-col`}>
      <ScratchWebsitePreview hotelName={property?.name ?? "Your Hotel"} />
    </div>
  );
}
