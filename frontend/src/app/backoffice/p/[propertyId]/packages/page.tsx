import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { can } from "@/lib/auth/permissions";
import { getCurrentStaff } from "@/lib/auth/current-staff";
import { UrlDialog } from "@/components/ui/url-dialog";
import { EmptyState } from "@/components/ui/widget";
import { getCompanyProperties } from "@/features/properties";
import {
  DeletePackageDialog,
  getPackage,
  listPackages,
  NewPackageForm,
  PACKAGE_ERROR_MESSAGES,
  PackageEditor,
  PackageList,
  packagesHref,
  PackagesHeader,
  PackagesSkeleton,
  parsePackageParams,
} from "@/features/packages";

export const metadata = { title: "Packages" };

type PackagesProps = Pick<PageProps<"/backoffice/p/[propertyId]/packages">, "params" | "searchParams">;

// Property packages: the list on the left, the selected package's editor on
// the right. Filters and the selection live in the URL; saves go through
// Server Actions. Management: Owner and Manager.
export default function Page({ params, searchParams }: PageProps<"/backoffice/p/[propertyId]/packages">) {
  return (
    <main id="main-content" tabIndex={-1} className="flex flex-col gap-5 px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-6">
      <Suspense fallback={<PackagesSkeleton />}>
        <Packages params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Packages({ params, searchParams }: PackagesProps) {
  const [{ propertyId }, query, user] = await Promise.all([params, searchParams, getCurrentStaff()]);
  if (!can(user, "packages.manage")) redirect("/forbidden");
  const { packageId, panel, error, ...filters } = parsePackageParams(query);
  const [list, properties] = await Promise.all([listPackages(propertyId, filters), getCompanyProperties()]);
  const property = properties.find((item) => item.id === propertyId);
  if (!property) notFound();

  // The URL's package, else the first one in the list.
  const selectedId = packageId ?? list.packages[0]?.id ?? null;
  const selected = selectedId ? await getPackage(propertyId, selectedId) : null;
  const closeHref = packagesHref(propertyId, filters, { packageId: selected?.id });

  return (
    <>
      <PackagesHeader
        place={{ name: property.name, location: `${property.town}, ${property.country}` }}
        createHref={packagesHref(propertyId, filters, { packageId: selected?.id, panel: "new" })}
      />
      {error ? (
        <p role="alert" className="rounded-xl border border-office-danger/40 bg-card px-4 py-3 text-sm font-medium text-office-danger">
          {PACKAGE_ERROR_MESSAGES[error]}
        </p>
      ) : null}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
        <PackageList propertyId={propertyId} list={list} filters={filters} selectedId={selected?.id ?? null} />
        {selected ? (
          <PackageEditor
            key={selected.id}
            propertyId={propertyId}
            pkg={selected}
            deleteHref={packagesHref(propertyId, filters, { packageId: selected.id, panel: "delete" })}
          />
        ) : (
          <EmptyState>{packageId ? "That package no longer exists." : "Choose or create a package to see its itinerary."}</EmptyState>
        )}
      </div>

      {panel === "new" ? (
        <UrlDialog title="Create package" closeHref={closeHref} variant="dialog">
          <NewPackageForm propertyId={propertyId} closeHref={closeHref} />
        </UrlDialog>
      ) : null}
      {panel === "delete" && selected ? (
        <DeletePackageDialog propertyId={propertyId} pkg={selected} filters={filters} closeHref={closeHref} />
      ) : null}
    </>
  );
}
