"use client";

/**
 * FundMethodTile — payment-method tile with the "ETA · Fee · Limit"
 * triplet that every serious fintech surfaces upfront. Pattern from
 * Wise / Mercury / Coinbase: never let the user pick a rail without
 * first knowing how fast it is, what it costs, and what it caps at.
 *
 * Active state uses an accent border + tinted bg + check-circle —
 * standard radio-card pattern. Whole tile is the click target.
 *
 * The ETA + fee strings come from i18n via the parent `t` so locale
 * variants stay coherent.
 */

import { CheckCircle2, CreditCard, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const METHOD_ICONS = {
  cib: CreditCard,
  edahabia: Wallet,
};

export default function FundMethodTile({ method, active, onClick, t }) {
  const Icon = METHOD_ICONS[method] ?? CreditCard;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative flex flex-col gap-[0.625em] p-[1em] rounded-[0.625em] border bg-surface text-left",
        "transition-[background-color,border-color,transform] duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        active
          ? "border-accent bg-status-active-bg"
          : "border-border hover:bg-surface-hover hover:-translate-y-[1px]",
      )}
    >
      <div className="flex items-center justify-between gap-[0.5em]">
        <span
          className={cn(
            "shrink-0 inline-flex items-center justify-center w-[2.25em] h-[2.25em] rounded-[0.5em]",
            active ? "bg-surface text-accent" : "bg-bg-alt text-text-secondary",
          )}
        >
          <Icon className="w-[1.125em] h-[1.125em]" strokeWidth={1.75} />
        </span>
        {active && (
          <CheckCircle2
            className="w-[1.125em] h-[1.125em] text-accent shrink-0"
            strokeWidth={1.75}
          />
        )}
      </div>
      <div className="flex flex-col gap-[0.125em] min-w-0">
        <span className="text-[0.9375em] font-semibold text-text font-body leading-[1.2]">
          {t(`method.${method}.name`)}
        </span>
        <span className="text-[0.75em] text-text-muted font-body leading-[1.4]">
          {t(`method.${method}.tagline`)}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-[0.875em] gap-y-[0.25em] items-baseline mt-[0.125em] pt-[0.625em] border-t border-border-light">
        <Triplet label={t("methodMeta.eta")} value={t(`method.${method}.eta`)} />
        <Triplet label={t("methodMeta.fee")} value={t(`method.${method}.fee`)} />
        <Triplet label={t("methodMeta.limit")} value={t(`method.${method}.limit`)} />
      </div>
    </button>
  );
}

function Triplet({ label, value }) {
  return (
    <span className="inline-flex items-baseline gap-[0.3em]">
      <span className="text-[0.625em] font-semibold tracking-[0.06em] uppercase text-text-muted">
        {label}
      </span>
      <span className="text-[0.75em] font-semibold text-text font-mono tabular-nums">
        {value}
      </span>
    </span>
  );
}
