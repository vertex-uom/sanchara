import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/staff";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/widget";
import {
  BasicInfoForm,
  DeactivatePropertyDialog,
  getPropertySettings,
  LogoCard,
  parseSettingsParams,
  SETTINGS_ERROR_MESSAGES,
  SettingsSkeleton,
  SettingsTabs,
  settingsHref,
  StatusCard,
} from "@/features/properties";

export const metadata = { title: "Property Settings" };

type SettingsProps = Pick<PageProps<"/backoffice/p/[propertyId]/settings">, "params" | "searchParams">;

// Property settings. The tab lives in the URL; only Basic Information has a
// design so far. Saves go through Server Actions.
export default function Page({ params, searchParams }: PageProps<"/backoffice/p/[propertyId]/settings">) {
  return (
    <main id="main-content" tabIndex={-1} className="flex flex-col gap-5 px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-6">
      <Suspense fallback={<SettingsSkeleton />}>
        <Settings params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Settings({ params, searchParams }: SettingsProps) {
  const [{ propertyId }, query] = await Promise.all([params, searchParams, getCurrentStaff()]);
  const { tab, deactivating, error } = parseSettingsParams(query);
  const property = await getPropertySettings(propertyId);
  if (!property) notFound();

  return (
    <>
      <PageHeader title="Property Settings" place={{ name: property.name, location: `${property.town}, ${property.country}` }} />
      <SettingsTabs propertyId={propertyId} active={tab} />
      {error ? (
        <p role="alert" className="rounded-xl border border-office-danger/40 bg-card px-4 py-3 text-sm font-medium text-office-danger">
          {SETTINGS_ERROR_MESSAGES[error]}
        </p>
      ) : null}

      {tab === "basic" ? (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_17rem]">
          <BasicInfoForm key={property.id} property={property} />
          <div className="flex flex-col gap-5 xl:col-start-2 xl:row-start-1">
            <LogoCard key={property.id} propertyId={property.id} logoUrl={property.logoUrl} propertyName={property.name} />
            <StatusCard property={property} deactivateHref={settingsHref(propertyId, { deactivating: true })} />
          </div>
        </div>
      ) : (
        <EmptyState>Coming soon</EmptyState>
      )}

      {deactivating && property.status === "active" ? (
        <DeactivatePropertyDialog property={property} closeHref={settingsHref(propertyId)} />
      ) : null}
    </>
  );
}
