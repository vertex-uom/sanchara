import { Suspense } from "react";
import { Ban, Building2, CircleCheck, Globe, type LucideIcon } from "lucide-react";
import { formatCount } from "@/lib/format/numbers";
import { AdminKpiCard, AdminKpiSkeleton, KPI_GRID } from "../components/kpi-card";
import { AdminChip } from "../components/ui";
import { getAccountKpis } from "../server/accounts";
import type { AccountKpiKey } from "../types";

const KPI_META: Record<AccountKpiKey, { label: string; icon: LucideIcon; chipNote?: string }> = {
  companies: { label: "Companies", icon: Building2, chipNote: "vs last month" },
  active: { label: "Active", icon: CircleCheck, chipNote: "of all companies" },
  suspended: { label: "Suspended", icon: Ban },
  "website-requests": { label: "Website requests", icon: Globe },
};

export function AccountKpis() {
  return (
    <section aria-label="Company metrics">
      <Suspense fallback={<AdminKpiSkeleton count={4} label="Loading company metrics" />}>
        <KpiCards />
      </Suspense>
    </section>
  );
}

async function KpiCards() {
  const kpis = await getAccountKpis();
  return (
    <ul className={KPI_GRID}>
      {kpis.map((kpi) => {
        const { label, icon, chipNote } = KPI_META[kpi.key];
        return (
          <AdminKpiCard
            key={kpi.key}
            icon={icon}
            label={label}
            value={formatCount(kpi.count)}
            chip={kpi.chip ? <AdminChip tone={kpi.chip.tone}>{kpi.chip.label}</AdminChip> : undefined}
            chipNote={kpi.chip ? chipNote : undefined}
            note={kpi.note}
          />
        );
      })}
    </ul>
  );
}
