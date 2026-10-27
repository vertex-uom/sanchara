import { Suspense } from "react";
import { Building2, CreditCard, Sparkles, ShieldBan, type LucideIcon } from "lucide-react";
import { formatMoney } from "@/lib/format/money";
import { formatCount, formatPercent } from "@/lib/format/numbers";
import { AdminKpiCard, AdminKpiSkeleton, KPI_GRID } from "../components/kpi-card";
import { AdminChip } from "../components/ui";
import { getAnalyticsKpis } from "../server/analytics";
import type { AnalyticsFilters, AnalyticsKpi, AnalyticsKpiKey } from "../types";
import { PERIOD_COMPARE } from "./search-params";

const KPI_META: Record<AnalyticsKpiKey, { label: string; icon: LucideIcon; lowerIsBetter?: true }> = {
  active: { label: "Active companies", icon: Building2 },
  new: { label: "New companies", icon: Sparkles },
  mrr: { label: "MRR", icon: CreditCard },
  blocked: { label: "Blocked for non-payment", icon: ShieldBan, lowerIsBetter: true },
};

export function formatKpiValue(value: AnalyticsKpi["value"]) {
  return "count" in value ? formatCount(value.count) : formatMoney(value.money);
}

// "+5.6%" / "−2.1%"; the sign is always shown.
export function formatDelta(ratio: number) {
  const text = formatPercent(Math.abs(ratio));
  return ratio < 0 ? `−${text}` : `+${text}`;
}

export function KpiRow({ filters }: { filters: AnalyticsFilters }) {
  return (
    <section aria-label="Summary metrics">
      <Suspense fallback={<AdminKpiSkeleton count={4} label="Loading summary metrics" />}>
        <KpiCards filters={filters} />
      </Suspense>
    </section>
  );
}

async function KpiCards({ filters }: { filters: AnalyticsFilters }) {
  const kpis = await getAnalyticsKpis(filters);
  return (
    <ul className={KPI_GRID}>
      {kpis.map((kpi) => {
        const { label, icon, lowerIsBetter } = KPI_META[kpi.key];
        const good = kpi.deltaRatio !== null && (lowerIsBetter ? kpi.deltaRatio <= 0 : kpi.deltaRatio >= 0);
        return (
          <AdminKpiCard
            key={kpi.key}
            icon={icon}
            label={label}
            value={formatKpiValue(kpi.value)}
            chip={kpi.deltaRatio === null ? <AdminChip tone="neutral">No comparison</AdminChip> : kpi.deltaRatio === 0 ? <AdminChip tone="neutral">No change</AdminChip> : <AdminChip tone={good ? "success" : "danger"}>{formatDelta(kpi.deltaRatio)}</AdminChip>}
            chipNote={kpi.deltaRatio !== null ? PERIOD_COMPARE[filters.period] : undefined}
            note={kpi.note}
          />
        );
      })}
    </ul>
  );
}
