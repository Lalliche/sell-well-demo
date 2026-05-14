/**
 * DeltaPill — tiny percentage-change indicator pill.
 *
 * Used in leaderboard rows + anywhere a metric needs a directional delta
 * indicator. Visually matches the trend pill inside `StatCard` so the
 * two read as the same primitive across the dashboard.
 *
 * Props:
 *   value       number — percentage change. Positive = up, negative = down, 0 = flat.
 *   size        "sm" | "md" — default "sm". sm = leaderboard cell, md = larger context.
 *   className   string
 *
 * Visual:
 *   positive → green tint  (↑ N%)
 *   negative → red tint    (↓ N%)
 *   flat     → muted gray  (— 0%)
 */

import { cn } from "@/lib/utils";

export default function DeltaPill({ value, size = "sm", className }) {
  if (value === null || value === undefined) return null;

  const isPositive = value > 0;
  const isNegative = value < 0;
  const sizeClasses = size === "md"
    ? "h-[1.625em] px-[0.5em] text-[0.75em]"
    : "h-[1.375em] px-[0.4375em] text-[0.6875em]";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[0.1875em] rounded-[0.375em] font-semibold font-body shrink-0",
        sizeClasses,
        isPositive && "bg-status-approved-bg text-trend-positive",
        isNegative && "bg-status-rejected-bg text-trend-negative",
        !isPositive && !isNegative && "bg-bg-alt text-text-muted",
        className,
      )}
      aria-label={
        isPositive ? `up ${value}%`
        : isNegative ? `down ${Math.abs(value)}%`
        : "no change"
      }
    >
      <span aria-hidden="true">
        {isPositive ? "↑" : isNegative ? "↓" : "—"}
      </span>
      {` ${Math.abs(value)}%`}
    </span>
  );
}
