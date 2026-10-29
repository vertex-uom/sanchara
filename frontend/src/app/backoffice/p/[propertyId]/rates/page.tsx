import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { can } from "@/lib/auth/permissions";
import { getCurrentStaff } from "@/lib/auth/current-staff";
import { colomboDateKey } from "@/lib/format/dates";
import { UrlDialog } from "@/components/ui/url-dialog";
import { getCompanyProperties } from "@/features/properties";
import {
  DeleteSeasonDialog,
  getRates,
  getTaxLines,
  parseRatesParams,
  PlanForm,
  RATES_ERROR_MESSAGES,
  RatesGrid,
  RatesHeader,
  ratesHref,
  RatesSkeleton,
  RatesTabs,
  RatesToolbar,
  SeasonForm,
  SeasonsList,
  TaxesCard,
} from "@/features/rates";

export const metadata = { title: "Rates & Seasons" };

type RatesProps = Pick<PageProps<"/backoffice/p/[propertyId]/rates">, "params" | "searchParams">;

// Rates per room type, season, plan and residency; seasons; taxes (read-only).
// Management: Owner and Manager.
// The tab, grid and open dialog live in the URL; saves go through Server Actions.
export default function Page({ params, searchParams }: PageProps<"/backoffice/p/[propertyId]/rates">) {
  return (
    <main id="main-content" tabIndex={-1} className="flex flex-col gap-5 px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-6">
      <Suspense fallback={<RatesSkeleton />}>
        <Rates params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Rates({ params, searchParams }: RatesProps) {
  const [{ propertyId }, query, user] = await Promise.all([params, searchParams, getCurrentStaff(), connection()]);
  if (!can(user, "rates.manage")) redirect("/forbidden");
  const { tab, residency, planId, panel, seasonId, error } = parseRatesParams(query);
  const [view, taxes, properties] = await Promise.all([getRates(propertyId, planId, residency), getTaxLines(), getCompanyProperties()]);
  const property = properties.find((item) => item.id === propertyId);
  if (!property) notFound();

  const plan = view.plans.find((item) => item.id === view.planId) ?? view.plans[0];
  const keep = { residency, planId: planId ? view.planId : null };
  const here = ratesHref(propertyId, { tab, ...keep });
  const season = seasonId ? (view.seasons.find((item) => item.id === seasonId) ?? null) : null;
  const seasonsHref = (open: { panel?: "edit-season" | "delete-season"; seasonId?: string } = {}) =>
    ratesHref(propertyId, { tab: "seasons", ...open });

  return (
    <>
      <RatesHeader
        propertyName={property.name}
        addSeasonHref={ratesHref(propertyId, { tab, ...keep, panel: "add-season" })}
        addPlanHref={ratesHref(propertyId, { tab, ...keep, panel: "add-plan" })}
      />
      <RatesTabs active={tab} hrefFor={(key) => ratesHref(propertyId, { tab: key, ...keep })} />
      {error ? (
        <p role="alert" className="rounded-xl border border-office-danger/40 bg-card px-4 py-3 text-sm font-medium text-office-danger">
          {RATES_ERROR_MESSAGES[error]}
        </p>
      ) : null}

      {tab === "rates" ? (
        <RatesGrid
          key={`${plan.id}-${residency}`}
          propertyId={propertyId}
          planId={plan.id}
          planName={plan.name}
          residency={residency}
          currency={view.currency}
          version={view.version}
          year={colomboDateKey(new Date()).slice(0, 4)}
          roomTypes={view.roomTypes}
          seasons={view.seasons}
          grid={view.grid}
          toolbar={
            <RatesToolbar
              residency={residency}
              planId={plan.id}
              plans={view.plans}
              hrefFor={(change) => ratesHref(propertyId, { residency: change.residency ?? residency, planId: change.planId ?? view.planId })}
            />
          }
        />
      ) : null}
      {tab === "seasons" ? (
        <SeasonsList
          seasons={view.seasons}
          editHref={(id) => seasonsHref({ panel: "edit-season", seasonId: id })}
          deleteHref={(id) => seasonsHref({ panel: "delete-season", seasonId: id })}
        />
      ) : null}
      {tab === "taxes" ? <TaxesCard taxes={taxes} /> : null}

      {panel === "add-season" || (panel === "edit-season" && season) ? (
        <UrlDialog title={season ? "Edit season" : "Add season"} closeHref={here} variant="dialog">
          <SeasonForm propertyId={propertyId} season={panel === "edit-season" ? season : null} closeHref={here} />
        </UrlDialog>
      ) : null}
      {panel === "delete-season" && season ? <DeleteSeasonDialog propertyId={propertyId} season={season} closeHref={here} /> : null}
      {panel === "add-plan" ? (
        <UrlDialog title="Add rate plan" closeHref={here} variant="dialog">
          <PlanForm propertyId={propertyId} plans={view.plans} closeHref={here} />
        </UrlDialog>
      ) : null}
    </>
  );
}
