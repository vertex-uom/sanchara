import { Suspense } from "react";
import { CheckCheck, Clock, Hourglass, Plus, type LucideIcon } from "lucide-react";
import { formatCount } from "@/lib/format/numbers";
import { AdminKpiCard, AdminKpiSkeleton, KPI_GRID } from "../components/kpi-card";
import { AdminChip } from "../components/ui";
import { getOnboardingKpis } from "../server/onboarding";
import type { OnboardingKpiKey } from "../types";

const KPI_META: Record<OnboardingKpiKey, { label: string; icon: LucideIcon }> = {
  awaiting: { label: "Awaiting first sign-in", icon: Hourglass },
  expired: { label: "Expired credentials", icon: Clock },
  created: { label: "Created this month", icon: Plus },
  setup: { label: "Setup completed this month", icon: CheckCheck },
};

export function OnboardingKpis() {
  return (
    <section aria-label="Onboarding metrics">
      <Suspense fallback={<AdminKpiSkeleton count={4} label="Loading onboarding metrics" />}>
        <KpiCards />
      </Suspense>
    </section>
  );
}

async function KpiCards() {
  const kpis = await getOnboardingKpis();
  return (
    <ul className={KPI_GRID}>
      {kpis.map((kpi) => {
        const { label, icon } = KPI_META[kpi.key];
        return <AdminKpiCard key={kpi.key} icon={icon} label={label} value={formatCount(kpi.count)} chip={kpi.chip ? <AdminChip tone={kpi.chip.tone}>{kpi.chip.label}</AdminChip> : undefined} note={kpi.note} />;
      })}
    </ul>
  );
}
