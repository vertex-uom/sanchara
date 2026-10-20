import { Suspense } from "react";
import { ArrowDown, ArrowUp, BedDouble, CalendarCheck, ChartNoAxesColumnIncreasing, Coins, Minus, type LucideIcon } from "lucide-react";
import { formatSignedPercent } from "@/lib/format/numbers";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/widget";
import { DEFAULT_KPI_PERIOD, KPI_KEYS, KPI_PERIOD_PARAMS, kpiPeriodLabel, type KpiKey, type KpiPeriod } from "../config";
import { getKpi } from "../server/kpis";
import type { KpiChange } from "../types";
import { KpiPeriodSelect } from "./kpi-period-select";
import { KpiValueText } from "./kpi-value";
import { Sparkline } from "./sparkline";

const KPI_META: Record<KpiKey, { title: string; icon: LucideIcon }> = {
  occupancy: { title: "Occupancy Rate", icon: BedDouble },
  adr: { title: "ADR", icon: Coins },
  revpar: { title: "RevPAR", icon: ChartNoAxesColumnIncreasing },
  roomNightsSold: { title: "Room Nights Sold", icon: CalendarCheck },
};

export type KpiPeriods = Record<KpiKey, KpiPeriod>;

// Four KPI cards: 1 column on phones, 2 from sm, 4 from xl.
export function KpiCards({ propertyId, periods }: { propertyId: string; periods: KpiPeriods }) {
  return (
    <section aria-labelledby="kpi-title">
      <h2 id="kpi-title" className="sr-only">
        Key performance indicators
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_KEYS.map((key) => (
          <li key={key}>
            <KpiCard propertyId={propertyId} kpiKey={key} periods={periods} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function KpiCard({ propertyId, kpiKey, periods }: { propertyId: string; kpiKey: KpiKey; periods: KpiPeriods }) {
  const { title, icon: Icon } = KPI_META[kpiKey];
  const period = periods[kpiKey];
  const titleId = `kpi-${kpiKey}-title`;

  // Keep the other cards' selections when this card's period changes.
  const otherParams: Record<string, string> = {};
  for (const key of KPI_KEYS) {
    if (key !== kpiKey && periods[key] !== DEFAULT_KPI_PERIOD) otherParams[KPI_PERIOD_PARAMS[key]] = periods[key];
  }

  return (
    <article aria-labelledby={titleId} className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 id={titleId} className="flex min-w-0 items-center gap-2 pt-1.5 text-sm font-medium text-office-text">
          <Icon aria-hidden="true" className="size-5 shrink-0 text-office-icon" />
          <span className="truncate">{title}</span>
        </h3>
        <KpiPeriodSelect
          id={`kpi-${kpiKey}-period`}
          kpiTitle={title}
          paramName={KPI_PERIOD_PARAMS[kpiKey]}
          value={period}
          otherParams={otherParams}
        />
      </div>
      <Suspense key={period} fallback={<KpiBodySkeleton />}>
        <KpiBody propertyId={propertyId} kpiKey={kpiKey} period={period} title={title} />
      </Suspense>
    </article>
  );
}

async function KpiBody({ propertyId, kpiKey, period, title }: { propertyId: string; kpiKey: KpiKey; period: KpiPeriod; title: string }) {
  const kpi = await getKpi(propertyId, kpiKey, period);
  const periodLabel = kpiPeriodLabel(period).toLowerCase();
  const trendWord = !kpi.change ? "" : kpi.change.ratio > 0 ? ", trending up" : kpi.change.ratio < 0 ? ", trending down" : ", flat";

  return (
    <div className="mt-3 flex flex-1 flex-col">
      <KpiValueText value={kpi.value} />
      <div className="mt-auto flex items-end justify-between gap-3 pt-3">
        <Trend change={kpi.change} />
        <Sparkline
          values={kpi.series}
          label={`${title} trend for ${periodLabel}${trendWord}`}
          className="max-w-32 min-w-20 flex-1"
        />
      </div>
    </div>
  );
}

// Direction is shown by arrow, sign and (for screen readers) words, not colour alone.
function Trend({ change }: { change: KpiChange | null }) {
  if (!change) return <p className="text-sm text-muted-foreground">No comparison yet</p>;

  const { ratio, comparisonLabel } = change;
  const [Icon, word, color]: [LucideIcon, string, string] =
    ratio > 0
      ? [ArrowUp, "Up", "text-office-success"]
      : ratio < 0
        ? [ArrowDown, "Down", "text-red-700"]
        : [Minus, "No change", "text-muted-foreground"];

  return (
    <p className="text-sm">
      <span className={cn("flex items-center gap-1 font-medium", color)}>
        <Icon aria-hidden="true" className="size-4" />
        <span className="sr-only">{word} </span>
        {formatSignedPercent(ratio)}
      </span>
      <span className="text-office-text">{comparisonLabel}</span>
    </p>
  );
}

function KpiBodySkeleton() {
  return (
    <div aria-busy="true" className="mt-3 flex flex-1 flex-col">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-9 w-28" />
      <div className="mt-auto flex items-end justify-between gap-3 pt-3">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  );
}
