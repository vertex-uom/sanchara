import { formatDateOnly, formatDayMonth } from "@/lib/format/dates";
import { formatPercent } from "@/lib/format/numbers";
import { FlatCard } from "@/components/ui/widget";
import type { OccupancyDay } from "../types";

// Sized so the SVG draws at about 1:1 on desktop: labels stay small and the
// chart doesn't grow tall enough to push the page past the viewport.
const WIDTH = 1000;
const HEIGHT = 260;
const PLOT = { left: 44, right: 972, top: 10, bottom: 226 };
const GRID = [0, 0.25, 0.5, 0.75, 1];

// Inline SVG on a fixed 0–100% scale. Ratios come from the API; this only
// positions them. Labels every second day; longer ranges label fewer days.
export function OccupancyChart({ days }: { days: OccupancyDay[] }) {
  const step = days.length > 1 ? (PLOT.right - PLOT.left) / (days.length - 1) : 0;
  const x = (index: number) => (days.length > 1 ? PLOT.left + index * step : (PLOT.left + PLOT.right) / 2);
  const y = (ratio: number) => PLOT.bottom - ratio * (PLOT.bottom - PLOT.top);
  const labelEvery = days.length <= 31 ? 2 : Math.ceil(days.length / 16);
  const line = `M${days.map((day, index) => `${x(index).toFixed(1)},${y(day.ratio).toFixed(1)}`).join(" L")}`;
  const area = `${line} L${x(days.length - 1).toFixed(1)},${PLOT.bottom} L${x(0).toFixed(1)},${PLOT.bottom} Z`;

  const highest = days.reduce((top, day) => (day.ratio > top.ratio ? day : top));
  const lowest = days.reduce((low, day) => (day.ratio < low.ratio ? day : low));
  const summary =
    `Occupancy by day from ${formatDateOnly(days[0].date)} to ${formatDateOnly(days[days.length - 1].date)}. ` +
    `Highest ${formatPercent(highest.ratio, 0)} on ${formatDayMonth(highest.date)}, ` +
    `lowest ${formatPercent(lowest.ratio, 0)} on ${formatDayMonth(lowest.date)}.`;

  return (
    <FlatCard aria-labelledby="occupancy-day-title" className="min-w-0 break-inside-avoid">
      <h2 id="occupancy-day-title" className="mb-4 text-base font-semibold">
        Occupancy by day
      </h2>
      {/* Phones scroll the chart sideways instead of shrinking the labels. */}
      <div tabIndex={0} aria-label="Occupancy by day chart" className="focus-ring overflow-x-auto rounded-md">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={summary} className="h-auto w-full min-w-208">
          <defs>
            <linearGradient id="occupancy-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--office-chart-bright)" stopOpacity="0.3" />
              <stop offset="1" stopColor="var(--office-chart-bright)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {GRID.map((ratio) => (
            <g key={ratio}>
              <line x1={PLOT.left} x2={PLOT.right} y1={y(ratio)} y2={y(ratio)} className="stroke-border" />
              <text x={PLOT.left - 10} y={y(ratio)} dy="0.35em" textAnchor="end" fontSize="12" className="fill-office-muted">
                {formatPercent(ratio, 0)}
              </text>
            </g>
          ))}
          <path d={area} fill="url(#occupancy-fill)" />
          <path d={line} fill="none" strokeWidth="2" strokeLinejoin="round" className="stroke-office-chart-bright" />
          {days.map((day, index) => (
            <g key={day.date}>
              <circle
                cx={x(index)}
                cy={y(day.ratio)}
                r={days.length > 40 ? 2.5 : 3.5}
                strokeWidth="2"
                className="fill-card stroke-office-chart-bright"
              >
                <title>{`${formatDayMonth(day.date)}: ${formatPercent(day.ratio, 0)}`}</title>
              </circle>
              {index % labelEvery === 0 ? (
                <text x={x(index)} y={PLOT.bottom + 24} textAnchor="middle" fontSize="12" className="fill-office-muted">
                  {formatDayMonth(day.date)}
                </text>
              ) : null}
            </g>
          ))}
        </svg>
      </div>
      {/* sr-only on the wrapper: a table won't shrink to 1px, so it would stretch the page. */}
      <div className="sr-only">
        <table>
          <caption>Occupancy by day</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Occupancy</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.date}>
                <th scope="row">{formatDateOnly(day.date)}</th>
                <td>{formatPercent(day.ratio, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FlatCard>
  );
}
