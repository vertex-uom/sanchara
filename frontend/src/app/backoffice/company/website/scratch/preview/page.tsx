import { Suspense } from "react";
import { Skeleton } from "@/components/ui/widget";
import { getCompanyProperties } from "@/features/properties";
import {
  ScratchWebsitePreview,
  siteFontVariables,
} from "@/features/website-builder";

export const metadata = { title: "Preview Your Website · Website Builder" };

// "Start from scratch": full-screen preview of the built site.
export default function Page() {
  return (
    <div className={`${siteFontVariables} flex flex-1 flex-col`}>
      <Suspense fallback={<Skeleton className="min-h-dvh w-full rounded-none" />}>
        <Preview />
      </Suspense>
    </div>
  );
}

async function Preview() {
  const [property] = await getCompanyProperties();
  return <ScratchWebsitePreview hotelName={property?.name ?? "Your Hotel"} />;
}
