import { getCurrentStaff } from "@/lib/auth/staff";
import { getCompanyProperties } from "@/features/properties";
import { AssistanceRequest } from "@/features/website-builder";

export const metadata = { title: "WEMIXT Assistance · Website Builder" };

// "Request WEMIXT assistance": ask WEMIXT to build the website.
export default async function Page() {
  const [[property], staff] = await Promise.all([
    getCompanyProperties(),
    getCurrentStaff(),
  ]);
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative isolate flex-1 overflow-hidden px-4 py-6 outline-none sm:px-6 lg:px-8 xl:px-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 -z-10 size-[28rem] rounded-full bg-office-chart-fill/70 blur-3xl"
      />
      <AssistanceRequest
        propertyName={property?.name ?? ""}
        staffName={staff.fullName}
      />
    </main>
  );
}
