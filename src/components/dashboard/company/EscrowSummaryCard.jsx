"use client";

/**
 * Escrow summary — right column of the company dashboard's hero zone.
 *
 * Wraps the shared `EscrowWalletCard` primitive but localizes its strings
 * (the primitive is currently hardcoded English from when it was built
 * standalone) and wires Fund / Withdraw to the future /escrow/fund and
 * /escrow/withdraw routes (Phase 7.9 + 7.10). Until those land, both go
 * to /escrow.
 *
 * Layout adapts the original primitive to dashboard context:
 *   - Same hero "Available" number + health bar + Reserved / Total deposited
 *   - Same Active/Moderate/Low/At Risk health states
 *   - Same width-animated bar on first paint (IntersectionObserver-driven)
 *   - i18n-aware status labels + helper messages
 *
 * Props:
 *   wallet  EscrowWallet | null  — null shows skeleton
 *   onFund  () => void           — defaults to router.push('/escrow/fund')
 *   onWithdraw () => void        — defaults to router.push('/escrow/withdraw')
 */

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import AppButton from "@/components/ui/Buttons";
import { format as formatDZD } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

const HEALTH_TONES = {
  active: {
    bar: "bg-trend-positive",
    text: "text-trend-positive",
    bg: "bg-status-approved-bg",
  },
  moderate: {
    bar: "bg-accent",
    text: "text-accent",
    bg: "bg-status-active-bg",
  },
  low: {
    bar: "bg-[#D97706]",
    text: "text-[#D97706]",
    bg: "bg-status-pending-bg",
  },
  "at-risk": {
    bar: "bg-trend-negative",
    text: "text-trend-negative",
    bg: "bg-status-rejected-bg",
  },
};

function getHealthState(available, deposited) {
  if (available <= 0) return "at-risk";
  if (!deposited || deposited <= 0) return "at-risk";
  const ratio = available / deposited;
  if (ratio >= 0.8) return "active";
  if (ratio >= 0.5) return "moderate";
  if (ratio >= 0.1) return "low";
  return "at-risk";
}

export default function EscrowSummaryCard({ wallet, onFund, onWithdraw }) {
  const t = useTranslations("Dashboard.CompanyDashboard.escrow");
  const router = useRouter();

  const handleFund = onFund ?? (() => router.push("/escrow/fund"));
  const handleWithdraw = onWithdraw ?? (() => router.push("/escrow/withdraw"));

  if (!wallet) return <EscrowSkeleton />;

  const available = Math.max(0, wallet.available_balance);
  const reserved = wallet.total_reserved ?? 0;
  const deposited = wallet.total_deposited ?? 0;
  const state = getHealthState(wallet.available_balance, deposited);
  const tone = HEALTH_TONES[state];

  // Cap the visible fill at 100% so the bar reads cleanly even when
  // available > deposited (rare — happens after returns from disputed leads).
  const fillPct = deposited > 0
    ? Math.max(0, Math.min(100, (available / deposited) * 100))
    : 0;

  return <CardBody
    state={state}
    tone={tone}
    available={available}
    reserved={reserved}
    deposited={deposited}
    fillPct={fillPct}
    onFund={handleFund}
    onWithdraw={handleWithdraw}
    t={t}
  />;
}

function CardBody({ state, tone, available, reserved, deposited, fillPct, onFund, onWithdraw, t }) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);

  // Animate the health bar on first viewport entry. IntersectionObserver
  // disconnects after the first hit so subsequent renders don't re-trigger.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Defer setState to rAF — never call setState in the effect body
          // synchronously (React 19 hard rule, see CLAUDE.md).
          const id = requestAnimationFrame(() => setAnimated(true));
          observer.disconnect();
          return () => cancelAnimationFrame(id);
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="bg-surface border border-border-light rounded-[0.75em] shadow-xs p-[1.375em] flex flex-col gap-[1.25em] h-full"
    >
      {/* Header: title + health pill */}
      <div className="flex items-center justify-between">
        <span className="text-[0.6875em] uppercase tracking-[0.08em] text-text-muted font-semibold">
          {t("title")}
        </span>
        <span
          className={cn(
            "inline-flex items-center h-[1.5em] px-[0.625em] rounded-full text-[0.6875em] font-semibold",
            tone.bg,
            tone.text,
          )}
        >
          {t(`health.${state}.label`)}
        </span>
      </div>

      {/* Hero — Available balance */}
      <div className="flex flex-col gap-[0.25em]">
        <span className="text-[0.75em] text-text-muted">{t("available")}</span>
        <span className="text-[2em] font-semibold font-mono tabular-nums text-text leading-none">
          {formatDZD(available)}
        </span>
      </div>

      {/* Health bar + helper message */}
      <div className="flex flex-col gap-[0.5em]">
        <div className="h-[0.5em] bg-bg-alt rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full", tone.bar)}
            style={{
              width: animated ? `${fillPct}%` : "0%",
              transition: "width 1100ms cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        </div>
        <span className="text-[0.75em] text-text-muted leading-[1.5]">
          {t(`health.${state}.message`)}
        </span>
      </div>

      {/* Breakdown — Reserved + Total deposited */}
      <div className="grid grid-cols-2 gap-[1em] border-t border-border-light pt-[1em]">
        <div className="flex flex-col gap-[0.125em] min-w-0">
          <span className="text-[0.6875em] text-text-muted uppercase tracking-[0.05em]">
            {t("reserved")}
          </span>
          <span className="text-[0.9375em] font-semibold font-mono tabular-nums text-text-secondary truncate">
            {formatDZD(reserved)}
          </span>
        </div>
        <div className="flex flex-col gap-[0.125em] min-w-0">
          <span className="text-[0.6875em] text-text-muted uppercase tracking-[0.05em]">
            {t("totalDeposited")}
          </span>
          <span className="text-[0.9375em] font-semibold font-mono tabular-nums text-text-secondary truncate">
            {formatDZD(deposited)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-[0.625em] mt-auto">
        <AppButton variant="primary" size="sm" onClick={onFund} className="flex-1">
          {t("fundWallet")}
        </AppButton>
        <AppButton variant="secondary" size="sm" onClick={onWithdraw} className="flex-1">
          {t("withdraw")}
        </AppButton>
      </div>
    </div>
  );
}

function EscrowSkeleton() {
  return (
    <div className="bg-surface border border-border-light rounded-[0.75em] shadow-xs p-[1.375em] flex flex-col gap-[1.25em] h-full">
      <div className="flex items-center justify-between">
        <span className="block h-[0.75em] w-[5em] rounded-[0.25em] bg-bg-alt" />
        <span className="block h-[1.5em] w-[4em] rounded-full bg-bg-alt" />
      </div>
      <div className="flex flex-col gap-[0.375em]">
        <span className="block h-[0.625em] w-[4em] rounded-[0.25em] bg-bg-alt" />
        <span className="block h-[2em] w-[8em] rounded-[0.25em] bg-bg-alt" />
      </div>
      <span className="block h-[0.5em] w-full rounded-full bg-bg-alt" />
      <div className="grid grid-cols-2 gap-[1em] border-t border-border-light pt-[1em]">
        <div className="flex flex-col gap-[0.375em]">
          <span className="block h-[0.625em] w-[60%] rounded-[0.25em] bg-bg-alt" />
          <span className="block h-[0.875em] w-[80%] rounded-[0.25em] bg-bg-alt" />
        </div>
        <div className="flex flex-col gap-[0.375em]">
          <span className="block h-[0.625em] w-[60%] rounded-[0.25em] bg-bg-alt" />
          <span className="block h-[0.875em] w-[80%] rounded-[0.25em] bg-bg-alt" />
        </div>
      </div>
      <div className="flex gap-[0.625em] mt-auto">
        <span className="block h-[2em] flex-1 rounded-[0.5em] bg-bg-alt" />
        <span className="block h-[2em] flex-1 rounded-[0.5em] bg-bg-alt" />
      </div>
    </div>
  );
}
