"use client";

/**
 * RunwayCard — pure presentation card for the "X leads reservable"
 * runway calculator. Reads the count + the framing copy as props so
 * the consumer (fund vs withdraw) can switch tone without forking.
 *
 * Shipped on /escrow/fund (forward: deposit pushes runway up) and
 * /escrow/withdraw (reverse: withdrawal pulls runway down). The
 * component is deliberately copy-driven — the goal-gradient effect
 * comes from showing the user the math, not from adjective-driven
 * push (per the UX research).
 *
 * Variants:
 *   - "neutral" (default) — bg-bg-alt + accent icon. Default state
 *     when the user hasn't entered an amount yet.
 *   - "positive" — bg-status-approved-bg + green icon. Use on fund
 *     when the typed amount increases the runway.
 *   - "warning" — bg-status-pending-bg + amber icon. Use on withdraw
 *     when the typed amount drops the runway below a threshold.
 */

import { TrendingUp, TrendingDown, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  neutral:  { bg: "bg-bg-alt",                                                                  iconCls: "text-accent-text",          countCls: "text-text" },
  positive: { bg: "bg-status-approved-bg border border-status-approved-text/15",                iconCls: "text-status-approved-text", countCls: "text-status-approved-text" },
  warning:  { bg: "bg-status-pending-bg  border border-status-pending-text/20",                 iconCls: "text-status-pending-text",  countCls: "text-status-pending-text" },
};

const VARIANT_ICONS = {
  neutral:  Inbox,
  positive: TrendingUp,
  warning:  TrendingDown,
};

export default function RunwayCard({
  count,
  variant = "neutral",
  label,
  body,
  className,
}) {
  const v = VARIANTS[variant] ?? VARIANTS.neutral;
  const Icon = VARIANT_ICONS[variant] ?? VARIANT_ICONS.neutral;

  return (
    <div
      className={cn(
        "flex items-start gap-[0.875em] p-[1em] rounded-[0.625em]",
        v.bg,
        className,
      )}
    >
      <span className="shrink-0 inline-flex items-center justify-center w-[2.25em] h-[2.25em] rounded-full bg-surface">
        <Icon className={cn("w-[1em] h-[1em]", v.iconCls)} strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-[0.125em] min-w-0 flex-1">
        <span className="text-[0.6875em] font-semibold tracking-[0.06em] uppercase text-text-muted font-body">
          {label}
        </span>
        <span className="flex items-baseline gap-[0.375em] min-w-0">
          <span
            className={cn(
              "font-mono text-[1.5em] font-semibold tracking-[-0.02em] tabular-nums leading-none",
              v.countCls,
            )}
          >
            {count}
          </span>
          <span className="text-[0.875em] text-text-secondary font-body leading-snug">
            {body}
          </span>
        </span>
      </div>
    </div>
  );
}
