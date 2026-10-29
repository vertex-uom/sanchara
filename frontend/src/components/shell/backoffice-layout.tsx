import { Suspense, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/current-staff";
import { getCompanyProperties } from "@/features/properties";
import { SidebarPlanCard } from "@/features/subscription";
import { BackofficeShell, BackofficeShellSkeleton } from "./backoffice-shell";

type BackofficeLayoutProps = {
  // Property from the URL; company pages pass nothing and use the first property.
  propertyId?: Promise<string>;
  children: ReactNode;
};

// Loads the shell's data for p/[propertyId] and company/* layouts.
export function BackofficeLayout({ propertyId, children }: BackofficeLayoutProps) {
  return (
    <Suspense fallback={<BackofficeShellSkeleton />}>
      <LoadedShell propertyId={propertyId}>{children}</LoadedShell>
    </Suspense>
  );
}

async function LoadedShell({ propertyId, children }: BackofficeLayoutProps) {
  const [id, user, properties] = await Promise.all([propertyId, getCurrentStaff(), getCompanyProperties()]);
  const switcherProperties = properties.map((property) => ({
    id: property.id,
    name: property.name,
    location: `${property.town}, ${property.country}`,
    imageUrl: property.imageUrl,
  }));
  const current = id ? switcherProperties.find((property) => property.id === id) : switcherProperties[0];
  if (!current) notFound();

  return (
    <BackofficeShell currentProperty={current} properties={switcherProperties} user={user} sidebarFooter={<SidebarPlanCard />}>
      {children}
    </BackofficeShell>
  );
}
