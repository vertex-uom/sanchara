import { Suspense } from "react";
import { Building2, CreditCard, Hotel, UsersRound, type LucideIcon } from "lucide-react";
import { formatMoney } from "@/lib/format/money";
import { formatPercent } from "@/lib/format/numbers";
import { AdminKpiCard, AdminKpiSkeleton, KPI_GRID } from "../components/kpi-card";
import { AdminChip } from "../components/ui";
import { getOverviewKpis } from "../server/overview";
import type { OverviewKpi, OverviewKpiKey } from "../types";

const KPI_META: Record<OverviewKpiKey, { label: string; icon: LucideIcon }> = {
  companies: { label: "Companies", icon: Building2 },
  properties: { label: "Properties", icon: Hotel },
  staff: { label: "Staff users", icon: UsersRound },
  subscriptions: { label: "Subscriptions (MRR)", icon: CreditCard },
};

const COUNT = new Intl.NumberFormat("en-LK");

export function formatKpiValue(value: OverviewKpi["value"]) {
  return "count" in value ? COUNT.format(value.count) : formatMoney(value.money);
}

// "+5.6%" / "−2.1%"; the sign is always shown.
export function formatDelta(ratio: number) {
  const text = formatPercent(Math.abs(ratio));
  return ratio < 0 ? `−${text}` : `+${text}`;
}

export function formatBreakdown(breakdown: OverviewKpi["breakdown"]) {
  return breakdown.map((part) => `${COUNT.format(part.count)} ${part.label}`).join(" · ");
}

export function KpiRow() {
  return (
    <section aria-label="Summary metrics">
      <Suspense fallback={<AdminKpiSkeleton count={4} label="Loading summary metrics" />}>
        <KpiCards />
      </Suspense>
    </section>
  );
}

async function KpiCards() {
  const kpis = await getOverviewKpis();
  return (
    <ul className={KPI_GRID}>
      {kpis.map((kpi) => {
        const { label, icon } = KPI_META[kpi.key];
        return (
          <AdminKpiCard
            key={kpi.key}
            icon={icon}
            label={label}
            value={formatKpiValue(kpi.value)}
            chip={kpi.deltaRatio !== null ? <AdminChip tone={kpi.deltaRatio < 0 ? "danger" : "success"}>{formatDelta(kpi.deltaRatio)}</AdminChip> : undefined}
            chipNote="vs last month"
            note={formatBreakdown(kpi.breakdown)}
          />
        );
      })}
    </ul>
  );
}
