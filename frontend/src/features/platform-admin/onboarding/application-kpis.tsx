import { Suspense } from "react";
import { CheckCheck, Clock, Inbox, MessageSquareMore, type LucideIcon } from "lucide-react";
import { formatCount } from "@/lib/format/numbers";
import { AdminKpiCard, AdminKpiSkeleton, KPI_GRID } from "../components/kpi-card";
import { AdminChip } from "../components/ui";
import { getApplicationKpis } from "../server/onboarding";
import type { ApplicationKpiKey } from "../types";

const KPI_META: Record<ApplicationKpiKey, { label: string; icon: LucideIcon }> = {
  new: { label: "New", icon: Inbox },
  "in-review": { label: "In review", icon: Clock },
  awaiting: { label: "Awaiting applicant", icon: MessageSquareMore },
  decided: { label: "Decided this month", icon: CheckCheck },
};

export function ApplicationKpis() {
  return (
    <section aria-label="Application metrics">
      <Suspense fallback={<AdminKpiSkeleton count={4} label="Loading application metrics" />}>
        <KpiCards />
      </Suspense>
    </section>
  );
}

async function KpiCards() {
  const kpis = await getApplicationKpis();
  return (
    <ul className={KPI_GRID}>
      {kpis.map((kpi) => {
        const { label, icon } = KPI_META[kpi.key];
        return (
          <AdminKpiCard
            key={kpi.key}
            icon={icon}
            label={label}
            value={formatCount(kpi.count)}
            chip={kpi.chip ? <AdminChip tone={kpi.chip.tone}>{kpi.chip.label}</AdminChip> : undefined}
            note={kpi.note}
          />
        );
      })}
    </ul>
  );
}
