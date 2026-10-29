import { Suspense } from "react";
import { ArrowLeftRight, Coins, History, Lock, Tag, type LucideIcon } from "lucide-react";
import { formatDateTime, formatRelativeDateTime } from "@/lib/format/dates";
import { cn } from "@/lib/utils";
import { AdminTable, TABLE_CELL, TABLE_HEAD_CELL, TABLE_ROW } from "../components/table";
import { AdminCard, AdminCardHeader, AdminChip, AdminSkeleton } from "../components/ui";
import { ICON_STROKE } from "../sidebar-modes";
import { getExchangeRate, listExchangeRateHistory } from "../server/finance";
import { UpdateRateDialog } from "./exchange-rate-dialog";
import { formatRate } from "./status";

// How the one platform rate is used, from the architecture docs: rate plans
// are LKR for residents and USD for non-residents; a reservation stores an
// immutable copy of the rate; the gateway follows the currency.
const USAGE: { icon: LucideIcon; title: string; detail: string }[] = [
  { icon: Tag, title: "Converts resident and non-resident prices", detail: "Rate plans are priced in LKR for residents and USD for non-residents. This rate converts between them when a quote is made." },
  { icon: Lock, title: "Reservations keep their rate", detail: "Each reservation stores the rate in force when it was quoted. Changing the platform rate never alters an existing booking or its folio." },
  { icon: ArrowLeftRight, title: "Does not pick the payment gateway", detail: "LKR payments go to PayHere and USD payments to the international card gateway, by currency, regardless of this rate." },
];

// Exchange rate tab: the current rate with its update action, where the
// rate is used, and the history of changes.
export function ExchangeRateTab() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 xl:grid-cols-[minmax(0,704fr)_minmax(0,400fr)]">
      {/* The current rate comes first on narrow screens; from xl the history takes the wide left column. */}
      <div className="flex flex-col gap-4 xl:col-start-2 xl:row-start-1">
        <CurrentRate />
        <RateUsage />
      </div>
      <div className="xl:col-start-1 xl:row-start-1">
        <RateHistory />
      </div>
    </div>
  );
}

function CurrentRate() {
  return (
    <AdminCard aria-labelledby="current-rate-title">
      <AdminCardHeader id="current-rate-title" icon={Coins} title="Platform exchange rate" />
      <Suspense fallback={<CurrentRateSkeleton />}>
        <CurrentRateBody />
      </Suspense>
    </AdminCard>
  );
}

async function CurrentRateBody() {
  const rate = await getExchangeRate();
  const now = new Date();
  const change = rate.previous === null ? null : rate.usdToLkr - rate.previous;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[11px] font-medium text-admin-muted-text">LKR per 1 USD</p>
        <p className="mt-1 flex flex-wrap items-baseline gap-2.5">
          <span className="text-[28px] leading-none font-semibold text-admin-heading tabular-nums">{formatRate(rate.usdToLkr)}</span>
          {change !== null ? <ChangeChip change={change} previous={rate.previous} /> : null}
        </p>
        <p className="mt-2.5 text-[11.5px] text-admin-muted-text">
          Set <time dateTime={rate.setAt}>{formatRelativeDateTime(rate.setAt, now)}</time> by {rate.setBy}
          {rate.note ? ` · ${rate.note}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <UpdateRateDialog current={rate.usdToLkr} />
        <p className="text-[11px] text-admin-muted-text">Applies to new quotes only.</p>
      </div>
    </div>
  );
}

// "+0.50 vs 297.90": absolute change against the rate it replaced.
function ChangeChip({ change, previous }: { change: number; previous: number | null }) {
  const rounded = Math.round(change * 100) / 100;
  if (rounded === 0) return <AdminChip tone="neutral">Unchanged</AdminChip>;
  return (
    <AdminChip tone={rounded > 0 ? "warning" : "success"}>
      {rounded > 0 ? "+" : "−"}
      {formatRate(Math.abs(rounded))}
      {previous !== null ? ` vs ${formatRate(previous)}` : ""}
    </AdminChip>
  );
}

function RateUsage() {
  return (
    <AdminCard aria-labelledby="rate-usage-title">
      <AdminCardHeader id="rate-usage-title" icon={ArrowLeftRight} title="Where the rate applies" />
      <ul className="flex flex-col">
        {USAGE.map(({ icon: Icon, title, detail }) => (
          <li key={title} className="flex items-start gap-3 border-b border-admin-border py-2.5 first:pt-0 last:border-b-0 last:pb-0">
            <Icon aria-hidden="true" strokeWidth={ICON_STROKE} className="mt-px size-5 shrink-0 text-admin-icon" />
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-admin-heading">{title}</p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-admin-muted-text">{detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </AdminCard>
  );
}

const HISTORY_COLUMNS = ["Set", "USD → LKR", "Change", "Set by", "Note"];

function RateHistory() {
  return (
    <AdminCard aria-labelledby="rate-history-title">
      <Suspense fallback={<HistorySkeleton />}>
        <RateHistoryBody />
      </Suspense>
    </AdminCard>
  );
}

async function RateHistoryBody() {
  const history = await listExchangeRateHistory();
  return (
    <>
      <AdminCardHeader id="rate-history-title" icon={History} title="Rate history" chip={<AdminChip tone="neutral">{history.length}</AdminChip>} />
      <AdminTable minWidth={560}>
        <thead>
          <tr className="bg-admin-muted">
            {HISTORY_COLUMNS.map((column) => (
              <th key={column} scope="col" className={cn(TABLE_HEAD_CELL, (column === "USD → LKR" || column === "Change") && "text-right")}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {history.map((entry) => {
            const change = entry.previous === null ? null : Math.round((entry.usdToLkr - entry.previous) * 100) / 100;
            return (
              <tr key={entry.id} className={TABLE_ROW}>
                <td className={cn(TABLE_CELL, "whitespace-nowrap")}>
                  <time dateTime={entry.setAt}>{formatDateTime(entry.setAt)}</time>
                </td>
                <td className={cn(TABLE_CELL, "text-right whitespace-nowrap tabular-nums")}>{formatRate(entry.usdToLkr)}</td>
                <td className={cn(TABLE_CELL, "text-right whitespace-nowrap tabular-nums", change === null ? "font-normal text-admin-muted-text" : change > 0 ? "text-admin-warning" : change < 0 ? "text-admin-success" : "font-normal text-admin-muted-text")}>
                  {change === null ? "—" : change === 0 ? "0.00" : `${change > 0 ? "+" : "−"}${formatRate(Math.abs(change))}`}
                </td>
                <td className={cn(TABLE_CELL, "whitespace-nowrap")}>{entry.setBy}</td>
                <td className={cn(TABLE_CELL, "font-normal text-admin-muted-text")}>{entry.note ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </AdminTable>
    </>
  );
}

function CurrentRateSkeleton() {
  return (
    <div aria-busy="true" className="space-y-3">
      <span className="sr-only">Loading exchange rate</span>
      <AdminSkeleton className="h-3 w-24" />
      <AdminSkeleton className="h-8 w-48" />
      <AdminSkeleton className="h-3 w-64" />
      <AdminSkeleton className="h-9.5 w-32" />
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div aria-busy="true" className="space-y-2">
      <span className="sr-only">Loading rate history</span>
      <AdminSkeleton className="mb-4 h-6 w-40" />
      <AdminSkeleton className="h-8" />
      {Array.from({ length: 8 }, (_, i) => (
        <AdminSkeleton key={i} className="h-11" />
      ))}
    </div>
  );
}
