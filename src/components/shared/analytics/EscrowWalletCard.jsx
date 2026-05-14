/**
 * EscrowWalletCard — Company escrow wallet status card.
 * Shows available balance prominently, reserved + deposited breakdown, a fill-bar health indicator,
 * and contextual CTA buttons. Four health states drive color and messaging.
 *
 * Props:
 *   available      number — available balance in DA (computed: deposited - reserved - paid - withdrawn)
 *   reserved       number — total frozen for active leads
 *   deposited      number — lifetime total deposited
 *   onFund         () => void — "Fund wallet" action
 *   onWithdraw     () => void — "Withdraw" action
 *   className      string
 *
 * Health states (derived automatically from available / deposited ratio):
 *   active   ≥ 80% available — all good
 *   moderate 50–80%          — mild warning
 *   low      10–50%          — action recommended
 *   at-risk  < 10%           — urgent, campaigns pausing
 */

"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import AppButton from "@/components/ui/Buttons";

const STATES = {
  active:   { label: "Active",   bar: "bg-trend-positive",  text: "text-trend-positive",  bg: "bg-[#EDF5F0]", message: "Your wallet is healthy. You can reserve and view all incoming leads." },
  moderate: { label: "Moderate", bar: "bg-accent",          text: "text-accent",           bg: "bg-[#ECF0F8]", message: "Balance is sufficient but consider topping up soon." },
  low:      { label: "Low",      bar: "bg-[#D97706]",       text: "text-[#D97706]",        bg: "bg-[#FDF6E3]", message: "Low balance — you may not be able to reserve some leads. Top up to stay unblocked." },
  "at-risk":{ label: "At Risk",  bar: "bg-trend-negative",  text: "text-trend-negative",   bg: "bg-[#FBECEC]", message: "No funds available. Lead contact details are hidden until you fund your wallet. Campaigns remain active." },
};

function getHealthState(available, deposited) {
  if (!deposited || deposited === 0) return "at-risk";
  const ratio = available / deposited;
  if (ratio >= 0.8) return "active";
  if (ratio >= 0.5) return "moderate";
  if (ratio >= 0.1) return "low";
  return "at-risk";
}

function fmt(n) {
  return `DZD ${Number(n).toLocaleString("fr-DZ")}`;
}

export default function EscrowWalletCard({
  available = 0,
  reserved  = 0,
  deposited = 0,
  onFund,
  onWithdraw,
  className,
}) {
  const state    = getHealthState(available, deposited);
  const config   = STATES[state];
  const fillPct  = deposited > 0 ? Math.max(0, Math.min(100, (available / deposited) * 100)) : 0;
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setAnimated(true); observer.disconnect(); } },
      { threshold: 0.2 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn(
      "bg-surface border border-border-light rounded-[0.625em] p-[1.375em] flex flex-col gap-[1.25em] shadow-xs",
      className,
    )}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
          Escrow Wallet
        </span>
        <span className={cn(
          "inline-flex items-center h-[1.5em] px-[0.625em] rounded-full text-[0.6875em] font-semibold font-body",
          config.bg, config.text,
        )}>
          {config.label}
        </span>
      </div>

      {/* Available balance — hero number */}
      <div className="flex flex-col gap-[0.25em]">
        <span className="text-[0.75em] text-text-muted font-body">Available</span>
        <span className="text-[2em] font-semibold font-mono tabular-nums text-text leading-none">
          {fmt(available)}
        </span>
      </div>

      {/* Health bar */}
      <div className="flex flex-col gap-[0.375em]">
        <div className="h-[0.5em] bg-bg-alt rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full", config.bar)}
            style={{
              width: animated ? `${fillPct}%` : "0%",
              transition: "width 1100ms cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        </div>
        <span className="text-[0.75em] text-text-muted font-body">{config.message}</span>
      </div>

      {/* Breakdown row */}
      <div className="flex gap-[1.5em] border-t border-border-light pt-[1em]">
        <div className="flex flex-col gap-[0.125em]">
          <span className="text-[0.6875em] text-text-muted font-body uppercase tracking-[0.05em]">Reserved</span>
          <span className="text-[0.9375em] font-semibold font-mono tabular-nums text-text-secondary">{fmt(reserved)}</span>
        </div>
        <div className="flex flex-col gap-[0.125em]">
          <span className="text-[0.6875em] text-text-muted font-body uppercase tracking-[0.05em]">Total deposited</span>
          <span className="text-[0.9375em] font-semibold font-mono tabular-nums text-text-secondary">{fmt(deposited)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-[0.625em]">
        <AppButton variant="primary" size="sm" onClick={onFund} className="flex-1">Fund wallet</AppButton>
        <AppButton variant="secondary" size="sm" onClick={onWithdraw} className="flex-1">Withdraw</AppButton>
      </div>
    </div>
  );
}
