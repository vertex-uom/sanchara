import { Suspense } from "react";
import { Layers } from "lucide-react";
import { formatMoney } from "@/lib/format/money";
import { formatCount, formatPercent } from "@/lib/format/numbers";
import { AdminTable, TABLE_CELL, TABLE_HEAD_CELL, TABLE_ROW } from "../components/table";
import { AdminCard, AdminCardHeader, AdminSkeleton } from "../components/ui";
import { getPlanBreakdown } from "../server/analytics";

const COLUMNS = ["Plan", "Companies", "MRR", "Share", "Avg properties", "Avg staff"] as const;
const NUMERIC = "text-right tabular-nums";

// Always shows all plans, whatever the Plan filter: the point is to compare them.
export function PlansTable() {
  return (
    <AdminCard aria-labelledby="analytics-plans-heading">
      <AdminCardHeader id="analytics-plans-heading" icon={Layers} title="Companies by plan" />
      <Suspense fallback={<AdminSkeleton className="h-[180px] rounded-[10px]" />}>
        <PlanRows />
      </Suspense>
    </AdminCard>
  );
}

const ONE_DECIMAL = new Intl.NumberFormat("en-LK", { maximumFractionDigits: 1 });

async function PlanRows() {
  const rows = await getPlanBreakdown();
  const totals = rows.reduce((acc, row) => ({ companies: acc.companies + row.companies, mrr: acc.mrr + row.mrr.amountMinor }), { companies: 0, mrr: 0 });
  const currency = rows[0]?.mrr.currency ?? "LKR";
  return (
    <AdminTable minWidth={560} aria-label="Companies by plan">
      <thead>
        <tr className="bg-admin-muted">
          {COLUMNS.map((column, i) => (
            <th key={column} scope="col" className={i === 0 ? TABLE_HEAD_CELL : `${TABLE_HEAD_CELL} text-right`}>
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.plan} className={TABLE_ROW}>
            <th scope="row" className={`${TABLE_CELL} text-left`}>
              {row.plan}
            </th>
            <td className={`${TABLE_CELL} ${NUMERIC}`}>{formatCount(row.companies)}</td>
            <td className={`${TABLE_CELL} ${NUMERIC}`}>{formatMoney(row.mrr)}</td>
            <td className={`${TABLE_CELL} ${NUMERIC}`}>
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true" className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-admin-muted sm:block">
                  <span className="block h-full rounded-full bg-admin-primary" style={{ width: `${Math.round(row.share * 100)}%` }} />
                </span>
                {formatPercent(row.share, 0)}
              </span>
            </td>
            <td className={`${TABLE_CELL} ${NUMERIC} font-normal text-admin-body`}>{ONE_DECIMAL.format(row.avgProperties)}</td>
            <td className={`${TABLE_CELL} ${NUMERIC} font-normal text-admin-body`}>{ONE_DECIMAL.format(row.avgStaff)}</td>
          </tr>
        ))}
        <tr className="[&>td,&>th]:border-t [&>td,&>th]:border-admin-border">
          <th scope="row" className={`${TABLE_CELL} text-left text-admin-muted-text`}>
            All plans
          </th>
          <td className={`${TABLE_CELL} ${NUMERIC}`}>{formatCount(totals.companies)}</td>
          <td className={`${TABLE_CELL} ${NUMERIC}`}>{formatMoney({ amountMinor: totals.mrr, currency })}</td>
          <td className={`${TABLE_CELL} ${NUMERIC}`}>100%</td>
          <td className={`${TABLE_CELL} ${NUMERIC} text-admin-muted-text`} colSpan={2} />
        </tr>
      </tbody>
    </AdminTable>
  );
}
