/**
 * StatCard — KPI metric card for dashboard overview rows.
 *
 * Props:
 *   label        string — metric label (uppercase overline style)
 *   value        string | number — main value displayed in IBM Plex Mono
 *   trend        number | null — percentage change (positive = up, negative = down, 0 = flat)
 *   trendLabel   string — text after the trend number (default: "vs last month")
 *   highlight    boolean — accent color on value
 *   icon         ReactNode — optional icon top-right
 *   sparkline    (number | {value:number})[] — optional. When present, a
 *                Sparkline renders as a faint background behind the value
 *                row (Stripe / Mercury / Polar pattern). Tone follows
 *                `trend` direction automatically.
 *   className    string
 *
 * Layout:
 *   Row 1: overline label left, icon right
 *   Row 2: big value + trend pill — same line. When `sparkline` is present,
 *          this row becomes a `position: relative` container with the
 *          sparkline absolute-filling the row behind the text.
 *   Divider
 *   Row 3: "Vs last month" muted text
 */

import { cn } from "@/lib/utils";
import Sparkline from "./Sparkline";

export default function StatCard({
  label,
  value,
  trend,
  trendLabel = "vs last month",
  highlight = false,
  icon,
  sparkline,
  className,
}) {
  const hasTrend  = trend !== null && trend !== undefined;
  const isPositive = hasTrend && trend > 0;
  const isNegative = hasTrend && trend < 0;
  // Sparkline only renders alongside a meaningful trend — it visualizes
  // the trend, so a card with no `trend` prop has nothing to show. This
  // also prevents the awkward case where a no-trend card shows a flat
  // line behind its value with no directional context.
  const hasSparkline =
    hasTrend && Array.isArray(sparkline) && sparkline.length >= 2;
  const sparklineTone = isNegative ? "negative" : isPositive ? "positive" : "muted";

  return (
    <div className={cn(
      "bg-surface border border-border-light rounded-[0.625em] p-[1.375em] flex flex-col gap-[0.875em] shadow-xs",
      className,
    )}>

      {/* Label + icon */}
      <div className="flex items-center justify-between">
        <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
          {label}
        </span>
        {icon && <span className="text-text-muted">{icon}</span>}
      </div>

      {/* Value + trend pill — sparkline (when present) anchors to the
          BOTTOM-RIGHT at 70% width so it doesn't overlap the value digits
          (left) or the trend pill (which sits inline next to the value).
          `min-h-[2.75em]` gives the chart enough vertical room to read
          as a sparkline (not a flat smudge). */}
      <div className="relative min-h-[2.75em] flex items-center gap-[0.625em] flex-wrap">
        {hasSparkline && (
          <div className="absolute right-0 bottom-0 w-[70%] h-[55%] pointer-events-none">
            <Sparkline data={sparkline} tone={sparklineTone} />
          </div>
        )}

        <span className={cn(
          "relative text-[1.75em] font-semibold font-mono tabular-nums leading-none",
          highlight ? "text-accent" : "text-text",
        )}>
          {value}
        </span>

        {hasTrend && (
          <span className={cn(
            "relative inline-flex items-center gap-[0.25em] h-[1.625em] px-[0.5em] rounded-[0.375em] text-[0.75em] font-semibold font-body shrink-0",
            isPositive && "bg-status-approved-bg text-[#2D6A4F]",
            isNegative && "bg-status-rejected-bg text-[#B13B3B]",
            !isPositive && !isNegative && "bg-bg-alt text-text-muted",
          )}>
            {isPositive && "↑"}
            {isNegative && "↓"}
            {!isPositive && !isNegative && "—"}
            {` ${Math.abs(trend)}%`}
          </span>
        )}
      </div>

      {/* Divider + vs label */}
      {hasTrend && (
        <>
          <div className="h-px bg-border-light" />
          <span className="text-[0.8125em] text-text-muted font-body">
            {trendLabel}
          </span>
        </>
      )}
    </div>
  );
}
