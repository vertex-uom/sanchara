import { Suspense } from "react";
import { TrendingUp } from "lucide-react";
import { formatMoney } from "@/lib/format/money";
import { formatCount } from "@/lib/format/numbers";
import { AdminSubTabs } from "../components/sub-tabs";
import { AdminCard, AdminCardHeader, AdminSkeleton } from "../components/ui";
import { getTrend } from "../server/analytics";
import type { AnalyticsFilters, AnalyticsMetric, TrendPoint } from "../types";
import { analyticsHref, METRIC_LABELS } from "./search-params";

const METRICS: AnalyticsMetric[] = ["companies", "mrr"];

// Twelve-month line chart, drawn as inline SVG so no charting dependency is
// needed. The Companies / MRR toggle is a URL parameter.
export function TrendChart({ filters }: { filters: AnalyticsFilters }) {
  return (
    <AdminCard aria-labelledby="analytics-trend-heading">
      <AdminCardHeader
        id="analytics-trend-heading"
        icon={TrendingUp}
        title="Last 12 months"
        action={<AdminSubTabs label="Chart metric" active={filters.metric} tabs={METRICS.map((metric) => ({ key: metric, label: METRIC_LABELS[metric], href: analyticsHref({ ...filters, metric }) }))} />}
      />
      <Suspense fallback={<AdminSkeleton className="h-[260px] rounded-[10px]" />}>
        <Chart filters={filters} />
      </Suspense>
    </AdminCard>
  );
}

const WIDTH = 720;
const HEIGHT = 240;
const PAD = { top: 16, right: 16, bottom: 28, left: 56 };
const GRID_LINES = 4;

const valueOf = (point: TrendPoint, metric: AnalyticsMetric) => (metric === "companies" ? point.companies : point.mrr.amountMinor);

// Axis labels: counts as-is, money in LKR without the minor unit noise.
function formatAxis(value: number, metric: AnalyticsMetric) {
  if (metric === "companies") return formatCount(value);
  const major = value / 100;
  return major >= 1_000_000 ? `${(major / 1_000_000).toFixed(1)}M` : major >= 1_000 ? `${Math.round(major / 1_000)}k` : String(Math.round(major));
}

function formatPointValue(point: TrendPoint, metric: AnalyticsMetric) {
  return metric === "companies" ? `${formatCount(point.companies)} companies` : formatMoney(point.mrr);
}

// Axis maximum = GRID_LINES × a tidy step (1, 2, 2.5 or 5 × 10ⁿ), so every
// grid label is a round number.
function niceMax(max: number) {
  if (max <= 0) return GRID_LINES;
  const raw = max / GRID_LINES;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((candidate) => candidate >= raw) ?? 10 * magnitude;
  return step * GRID_LINES;
}

async function Chart({ filters }: { filters: AnalyticsFilters }) {
  const points = await getTrend(filters);
  const { metric } = filters;
  const values = points.map((point) => valueOf(point, metric));
  const max = niceMax(Math.max(...values));
  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const baseline = PAD.top + innerHeight;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerWidth / 2 : (i / (points.length - 1)) * innerWidth);
  const y = (value: number) => baseline - (value / max) * innerHeight;
  const path = values.map((value, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(value).toFixed(1)}`).join(" ");
  const area = `${path} L${x(points.length - 1).toFixed(1)} ${baseline.toFixed(1)} L${x(0).toFixed(1)} ${baseline.toFixed(1)} Z`;
  const first = points[0];
  const last = points[points.length - 1];
  const change = valueOf(last, metric) - valueOf(first, metric);
  const summary = `${METRIC_LABELS[metric]} went from ${formatPointValue(first, metric)} in ${first.label} to ${formatPointValue(last, metric)} in ${last.label}.`;
  const changeText = metric === "companies" ? formatCount(Math.abs(change)) : formatMoney({ amountMinor: Math.abs(change), currency: last.mrr.currency });

  return (
    <figure className="m-0">
      {/* Scrolls sideways on narrow screens, like the tables, so the labels stay legible. */}
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={summary} className="block h-auto w-full min-w-[600px] text-admin-primary">
          {Array.from({ length: GRID_LINES + 1 }, (_, i) => {
            const value = (max / GRID_LINES) * i;
            const lineY = y(value);
            return (
              <g key={i}>
                <line x1={PAD.left} x2={WIDTH - PAD.right} y1={lineY} y2={lineY} className="stroke-admin-border" strokeDasharray={i === 0 ? undefined : "3 4"} />
                <text x={PAD.left - 10} y={lineY + 3.5} textAnchor="end" className="fill-admin-muted-text text-[10.5px]">
                  {formatAxis(value, metric)}
                </text>
              </g>
            );
          })}
          <path d={area} fill="currentColor" opacity={0.08} />
          <path d={path} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {points.map((point, i) => {
            const isLast = i === points.length - 1;
            return (
              <g key={point.month}>
                <circle cx={x(i)} cy={y(values[i])} r={isLast ? 4 : 2.5} fill="currentColor" className={isLast ? "stroke-admin-card" : undefined} strokeWidth={2}>
                  <title>{`${point.label}: ${formatPointValue(point, metric)}`}</title>
                </circle>
                <text x={x(i)} y={HEIGHT - 8} textAnchor="middle" className="fill-admin-muted-text text-[10.5px]">
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="mt-2 text-[11px] text-admin-muted-text">
        {formatPointValue(last, metric)} now · {change >= 0 ? "+" : "−"}
        {changeText} since {first.label}
        {filters.plan ? ` · ${filters.plan} plan only` : ""}
      </figcaption>
    </figure>
  );
}
