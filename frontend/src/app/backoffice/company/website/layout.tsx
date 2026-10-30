import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { can } from "@/lib/auth/permissions";
import { getCurrentStaff } from "@/lib/auth/current-staff";

// Website Builder is Owner and Manager only; Front Desk opening any of its
// pages by URL is sent to /forbidden, as the menu does not show it to them.
export default function Layout({ children }: LayoutProps<"/backoffice/company/website">) {
  return (
    <Suspense fallback={null}>
      <WebsiteAccess>{children}</WebsiteAccess>
    </Suspense>
  );
}

async function WebsiteAccess({ children }: { children: ReactNode }) {
  const user = await getCurrentStaff();
  if (!can(user, "website.manage")) redirect("/forbidden");
  return children;
}
