import { Suspense } from "react";
import { Skeleton } from "@/components/ui/widget";
import { getCurrentStaff } from "@/lib/auth/current-staff";
import { getCompanyProperties } from "@/features/properties";
import { AssistanceRequest, getAssistanceRequest } from "@/features/website-builder";

export const metadata = { title: "WEMIXT Assistance · Website Builder" };

type SearchParams = Promise<{ edit?: string }>;

// "Request WEMIXT assistance": ask WEMIXT to build the website.
// "?edit=1" changes a request that was already sent.
export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative isolate flex-1 overflow-hidden px-4 py-6 outline-none sm:px-6 lg:px-8 xl:px-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 -z-10 size-112 rounded-full bg-office-chart-fill/70 blur-3xl"
      />
      <Suspense fallback={<Skeleton className="h-128 w-full rounded-2xl" />}>
        <Request searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Request({ searchParams }: { searchParams: SearchParams }) {
  const [[property], staff, request, { edit }] = await Promise.all([
    getCompanyProperties(),
    getCurrentStaff(),
    getAssistanceRequest(),
    searchParams,
  ]);
  return (
    <AssistanceRequest
      propertyName={property?.name ?? ""}
      staffName={staff.fullName}
      request={request}
      editing={edit === "1"}
    />
  );
}
