"use client";

import { useState } from "react";
import { cn } from "cn";
import { formatDateOnly, formatDayMonth } from "@/lib/format/dates";
import type { DailyCount } from "../server/website-analytics";
import { formCardClass } from "./template-fields";

const RANGES = [7, 14, 30] as const;
const WIDTH = 760;
const HEIGHT = 240;
const PLOT = { left: 8, right: 752, top: 12, bottom: 206 };

// Daily visitors as an area chart, for the last 7, 14 or 30 days.
export function VisitorsChart({ days }: { days: DailyCount[] }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(14);
  const shown = days.slice(-range);
  const total = shown.reduce((sum, day) => sum + day.count, 0);

  const max = Math.max(...shown.map((day) => day.count), 1) * 1.1;
  const step =
    shown.length > 1 ? (PLOT.right - PLOT.left) / (shown.length - 1) : 0;
  const x = (index: number) => PLOT.left + index * step;
  const y = (count: number) =>
    PLOT.bottom - (count / max) * (PLOT.bottom - PLOT.top);
  const line = `M${shown.map((day, index) => `${x(index).toFixed(1)},${y(day.count).toFixed(1)}`).join(" L")}`;
  const area = `${line} L${x(shown.length - 1).toFixed(1)},${PLOT.bottom} L${x(0).toFixed(1)},${PLOT.bottom} Z`;
  const labelEvery = range === 30 ? 3 : 1;
  const last = shown[shown.length - 1];
  const summary = shown.length
    ? `Visitors per day from ${formatDateOnly(shown[0].date)} to ${formatDateOnly(last.date)}, ${total.toLocaleString("en-US")} in total.`
    : "No visitor data yet.";

  return (
    <section
      aria-labelledby="visitors-chart-title"
      className={cn(formCardClass, "min-w-0")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="visitors-chart-title"
            className="font-semibold text-office-icon"
          >
            Visitors
          </h2>
          <p className="text-xs text-office-muted">
            <span className="font-semibold text-office-icon">
              {total.toLocaleString("en-US")}
            </span>{" "}
            in the last {range} days
          </p>
        </div>
        <div
          role="group"
          aria-label="Chart range"
          className="flex rounded-lg bg-office-chip p-1"
        >
          {RANGES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={range === option}
              onClick={() => setRange(option)}
              className={cn(
                "focus-ring h-8 rounded-md px-3 text-xs font-medium transition-colors",
                range === option
                  ? "bg-card font-semibold text-office-icon shadow-sm"
                  : "text-office-muted",
              )}
            >
              {option} days
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={summary}
        className="mt-4 h-auto w-full"
      >
        <defs>
          <linearGradient id="visitors-fill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0"
              stopColor="var(--office-chart-bright)"
              stopOpacity="0.35"
            />
            <stop
              offset="1"
              stopColor="var(--office-chart-bright)"
              stopOpacity="0.03"
            />
          </linearGradient>
        </defs>
        {shown.length > 1 ? (
          <>
            <path d={area} fill="url(#visitors-fill)" />
            <path
              d={line}
              fill="none"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              className="stroke-office-chart-bright"
            />
            <circle
              cx={x(shown.length - 1)}
              cy={y(last.count)}
              r="5"
              strokeWidth="2.5"
              className="fill-white stroke-office-chart-bright"
            />
          </>
        ) : null}
        {shown.map((day, index) =>
          index % labelEvery === 0 || index === shown.length - 1 ? (
            <text
              key={day.date}
              x={x(index)}
              y={HEIGHT - 8}
              textAnchor={
                index === 0
                  ? "start"
                  : index === shown.length - 1
                    ? "end"
                    : "middle"
              }
              fontSize="12"
              className="fill-office-muted"
            >
              {index === 0
                ? formatDayMonth(day.date)
                : Number(day.date.slice(8))}
            </text>
          ) : null,
        )}
      </svg>
    </section>
  );
}
