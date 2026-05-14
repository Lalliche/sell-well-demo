/**
 * StatCardBreakdown — Big headline number destructured into 2–3 sub-values below a divider.
 * Use when a total means more when you see its parts (e.g. "42 leads → 18 submitted, 12 acknowledged, 12 converted").
 *
 * Props:
 *   label       string — overline label above the headline
 *   value       string | number — the big headline number
 *   icon        ReactNode — optional icon top-right
 *   highlight   boolean — 2px accent top border
 *   items       Array<{ label: string, value: string | number, color?: "positive" | "negative" | "accent" | "muted" }>
 *   className   string
 */

import { cn } from "@/lib/utils";

export default function StatCardBreakdown({
  label,
  value,
  icon,
  highlight = false,
  items = [],
  className,
}) {
  return (
    <div
      className={cn(
        "bg-surface border border-border-light rounded-[0.625em] p-[1.375em] flex flex-col gap-[0.875em] shadow-xs",
        className,
      )}
    >
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
          {label}
        </span>
        {icon && <span className="text-text-muted">{icon}</span>}
      </div>

      {/* Headline value */}
      <span className={cn(
        "text-[1.75em] font-semibold font-mono tabular-nums leading-none",
        highlight ? "text-accent" : "text-text",
      )}>
        {value}
      </span>

      {/* Divider */}
      <div className="h-[1px] bg-border-light" />

      {/* Sub-items */}
      <div className="flex flex-col gap-[0.5em]">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-[0.8125em] text-text-secondary font-body">{item.label}</span>
            <span className={cn(
              "text-[0.8125em] font-semibold font-mono tabular-nums",
              item.color === "positive" && "text-trend-positive",
              item.color === "negative" && "text-trend-negative",
              item.color === "accent"   && "text-accent",
              item.color === "muted"    && "text-text-muted",
              !item.color               && "text-text",
            )}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
