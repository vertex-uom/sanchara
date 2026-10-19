import { Bed, Calendar, ChartNoAxesColumn, Database, type LucideIcon } from "lucide-react";
import { KPI_KEYS, type KpiKey } from "../config";
import type { KpiValue } from "../types";
import { KpiValueText } from "./kpi-value";

// The Reports design labels and icons differ from the Overview cards.
const REPORT_KPI_META: Record<KpiKey, { title: string; icon: LucideIcon }> = {
  occupancy: { title: "Occupancy rate", icon: Bed },
  adr: { title: "ADR", icon: Database },
  revpar: { title: "RevPAR", icon: ChartNoAxesColumn },
  roomNightsSold: { title: "Room nights sold", icon: Calendar },
};

// Four KPI cards: 1 column on phones, 2 from sm, 4 from 2xl (the icon tiles
// leave too little room for LKR figures at xl). No trend on this page.
export function ReportKpis({ kpis }: { kpis: Record<KpiKey, KpiValue> }) {
  return (
    <section aria-labelledby="report-kpi-title">
      <h2 id="report-kpi-title" className="sr-only">
        Key figures
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {KPI_KEYS.map((key) => {
          const { title, icon: Icon } = REPORT_KPI_META[key];
          return (
            <li key={key}>
              <article
                aria-labelledby={`report-kpi-${key}`}
                className="flex h-full items-center gap-5 rounded-2xl border border-border bg-card px-6 py-5"
              >
                <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-office-tint-teal">
                  <Icon aria-hidden="true" className="size-7 text-office-primary" />
                </span>
                <div className="min-w-0">
                  <h3 id={`report-kpi-${key}`} className="text-sm text-office-label">
                    {title}
                  </h3>
                  <KpiValueText value={kpis[key]} />
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
