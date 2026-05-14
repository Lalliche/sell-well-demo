"use client";

/**
 * WithdrawLedgerHero — three-row monospace ledger hero. The withdraw
 * page's signature visual asymmetry vs the fund page: instead of one
 * billboard balance, we show Total · Pending · Available — with the
 * Pending row visibly subtracting from Total to produce Available.
 * Pattern from Upwork / Steam / Coinbase. Steel-blue dominant, no
 * green strip — withdraw is cooler than fund by design.
 *
 * Available is the largest, mono, accent-toned. Pending is amber-tinted
 * when > 0 so the user sees at a glance that funds are frozen.
 */

import { motion } from "motion/react";
import { Wallet, Lock } from "lucide-react";
import AnimatedDzdNumber from "@/components/shared/analytics/AnimatedDzdNumber";
import InfoPopover from "@/components/shared/feedback/InfoPopover";
import { format as formatDZD } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

export default function WithdrawLedgerHero({ wallet, t, className }) {
  const totalDeposited = wallet?.total_deposited ?? 0;
  const totalReserved = wallet?.total_reserved ?? 0;
  const totalPaidOut = wallet?.total_paid_out ?? 0;
  const totalWithdrawn = wallet?.total_withdrawn ?? 0;
  const pending = wallet?.total_pending_withdrawal ?? 0;
  const available = wallet?.available_balance ?? 0;

  // Total = what's still in the wallet (deposits − paid − withdrawn).
  // Pending+Reserved are subtracted from this to produce Available.
  const totalInWallet =
    totalDeposited - totalPaidOut - totalWithdrawn;

  return (
    <motion.section
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "flex flex-col gap-[0.875em] p-[1.25em] rounded-[0.75em]",
        "bg-surface border border-border-light",
        className,
      )}
    >
      <div className="flex items-center gap-[0.5em]">
        <span className="text-[0.6875em] font-semibold tracking-[0.08em] uppercase text-text-muted">
          {t("ledger.eyebrow")}
        </span>
      </div>

      <div className="flex flex-col gap-[0.5em]">
        <LedgerRow
          icon={<Wallet className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />}
          label={t("ledger.total")}
          value={totalInWallet}
          variant="muted"
        />
        {totalReserved > 0 && (
          <LedgerRow
            icon={<Lock className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />}
            label={
              <span className="inline-flex items-center gap-[0.25em]">
                {t("ledger.reserved")}
                <InfoPopover
                  label={t("info.reserved.label")}
                  body={t("info.reserved.body")}
                  size="sm"
                  align="left"
                />
              </span>
            }
            value={-totalReserved}
            variant="muted"
            negative
          />
        )}
        {pending > 0 && (
          <LedgerRow
            icon={<Lock className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />}
            label={
              <span className="inline-flex items-center gap-[0.25em]">
                {t("ledger.pending")}
                <InfoPopover
                  label={t("info.pending.label")}
                  body={t("info.pending.body")}
                  size="sm"
                  align="left"
                />
              </span>
            }
            value={-pending}
            variant="warning"
            negative
          />
        )}
      </div>

      <div className="flex items-end justify-between gap-[0.5em] pt-[0.875em] border-t border-border">
        <div className="flex flex-col gap-[0.125em]">
          <span className="text-[0.6875em] font-semibold tracking-[0.08em] uppercase text-text-muted">
            {t("ledger.available")}
          </span>
          <span className="text-[0.75em] text-text-muted font-body">
            {t("ledger.availableSubtitle")}
          </span>
        </div>
        <div className="flex items-baseline gap-[0.375em]">
          <AnimatedDzdNumber
            value={available}
            withSymbol={false}
            className="font-mono text-[2em] font-semibold tracking-[-0.02em] text-accent-text leading-[1.05] tabular-nums"
          />
          <span className="font-mono text-[0.875em] font-semibold text-text-muted">
            DZD
          </span>
        </div>
      </div>
    </motion.section>
  );
}

function LedgerRow({ icon, label, value, variant = "muted", negative }) {
  const tone =
    variant === "warning"
      ? "text-status-pending-text"
      : "text-text-secondary";
  return (
    <div className="flex items-center justify-between gap-[0.5em]">
      <span className={cn("inline-flex items-center gap-[0.5em] text-[0.8125em] font-body", tone)}>
        <span
          className={cn(
            "inline-flex items-center justify-center w-[1.5em] h-[1.5em] rounded-full",
            variant === "warning" ? "bg-status-pending-bg text-status-pending-text" : "bg-bg-alt text-text-muted",
          )}
        >
          {icon}
        </span>
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-[0.9375em] font-semibold tabular-nums",
          tone,
          negative && "before:content-['−_']",
        )}
      >
        {formatDZD(Math.abs(value), { withSymbol: false })}
        <span className="text-[0.75em] text-text-muted font-mono ms-[0.375em]">
          DZD
        </span>
      </span>
    </div>
  );
}
