"use client";

/**
 * Sparkline — minimal area chart with two layout modes:
 *
 *   "fill" (default) — absolute-fills its `position: relative` parent.
 *                       Used as a faint background behind KPI values
 *                       (Stripe / Mercury / Polar pattern). Default opacity 0.55.
 *   "inline"          — renders inline at the size given by `width` /
 *                       `height` (em values). Used for trend pills inside
 *                       table rows on /partner-links. Full opacity, no
 *                       absolute positioning, accepts a screen-reader label.
 *
 * Tone-aware:
 *   "positive" (default) → accent stroke + accent-light fill gradient
 *   "negative"           → trend-negative stroke + matching fill gradient
 *   "muted"              → text-muted stroke + bg-alt fill (use when the
 *                           data is informational, not directional)
 *
 * Usage (fill mode — KPI background):
 *   <div className="relative ...">
 *     <Sparkline data={[12, 18, 14, 22, 30]} />
 *     <span className="relative ...">{value}</span>
 *   </div>
 *
 * Usage (inline mode — table row trend):
 *   <Sparkline data={row.click_buckets} mode="inline" width="5em" height="1.5em" ariaLabel="Last 30 days" />
 *
 * `data` accepts either an array of numbers or an array of `{value: number}`
 * objects. We normalize internally so callers don't have to wrap.
 *
 * Props:
 *   data       (number | {value:number})[]   required, ≥ 2 points
 *   tone       "positive" | "negative" | "muted"   default "positive"
 *   mode       "fill" | "inline"                   default "fill"
 *   width      string — em width (inline mode only)   default "5em"
 *   height     string — em height (inline mode only)  default "1.5em"
 *   ariaLabel  string — screen-reader label (inline mode only)
 *   className  extra classes (e.g. opacity tweak)
 */

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useId } from "react";
import { cn } from "@/lib/utils";

const TONE_COLOR = {
  positive: "var(--color-accent)",
  negative: "var(--color-trend-negative)",
  muted:    "var(--color-text-muted)",
};

function normalize(data) {
  if (!Array.isArray(data) || data.length < 2) return null;
  return data.map((d, i) =>
    typeof d === "number" ? { i, value: d } : { i, value: d.value },
  );
}

export default function Sparkline({
  data,
  tone = "positive",
  mode = "fill",
  width = "5em",
  height = "1.5em",
  ariaLabel,
  className,
}) {
  const points = normalize(data);
  const gradientId = useId().replace(/:/g, "");
  if (!points) return null;

  const color = TONE_COLOR[tone] ?? TONE_COLOR.positive;
  const isInline = mode === "inline";

  const chart = (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={points}
        // Inner padding so the curve + 1.5px stroke never touch the SVG
        // edges. Top = headroom for peaks; right/left = stroke buffer.
        margin={{ top: 6, right: 4, bottom: 0, left: 4 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
          dot={false}
          activeDot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  if (isInline) {
    return (
      <span
        role={ariaLabel ? "img" : undefined}
        aria-label={ariaLabel}
        aria-hidden={ariaLabel ? undefined : true}
        className={cn("inline-block align-middle pointer-events-none select-none", className)}
        style={{ width, height }}
      >
        {chart}
      </span>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute inset-0 pointer-events-none select-none opacity-[0.55]",
        className,
      )}
    >
      {chart}
    </div>
  );
}
