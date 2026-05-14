/**
 * EarningsBreakdownCard — Sales Partner earnings summary card.
 * Shows available balance prominently, with pending and withdrawn as sub-values,
 * and a withdraw CTA. Distinct from EscrowWalletCard — this is partner-side earnings, not escrow.
 *
 * Props:
 *   available   number — earned commissions minus withdrawn (withdrawable now)
 *   pending     number — confirmed but not yet withdrawn
 *   withdrawn   number — lifetime withdrawn total
 *   onWithdraw  () => void
 *   bankingSetup boolean — if false, withdraw is disabled with a helper message
 *   className   string
 */

import { cn } from "@/lib/utils";
import AppButton from "@/components/ui/Buttons";

function fmt(n) {
  return `DZD ${Number(n).toLocaleString("fr-DZ")}`;
}

export default function EarningsBreakdownCard({
  available    = 0,
  pending      = 0,
  withdrawn    = 0,
  onWithdraw,
  bankingSetup = true,
  className,
}) {
  return (
    <div className={cn(
      "bg-surface border border-border-light rounded-[0.625em] p-[1.375em] flex flex-col gap-[1.125em] shadow-xs",
      className,
    )}>

      {/* Header */}
      <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
        Earnings
      </span>

      {/* Available balance — hero */}
      <div className="flex flex-col gap-[0.2em]">
        <span className="text-[0.75em] text-text-muted font-body">Available to withdraw</span>
        <span className="text-[2em] font-semibold font-mono tabular-nums text-accent leading-none">
          {fmt(available)}
        </span>
      </div>

      {/* Breakdown */}
      <div className="flex gap-[1.5em] border-t border-border-light pt-[0.875em]">
        <div className="flex flex-col gap-[0.125em]">
          <span className="text-[0.6875em] text-text-muted font-body uppercase tracking-[0.05em]">Pending</span>
          <span className="text-[0.9375em] font-semibold font-mono tabular-nums text-[#8B6914]">{fmt(pending)}</span>
        </div>
        <div className="flex flex-col gap-[0.125em]">
          <span className="text-[0.6875em] text-text-muted font-body uppercase tracking-[0.05em]">Withdrawn</span>
          <span className="text-[0.9375em] font-semibold font-mono tabular-nums text-text-secondary">{fmt(withdrawn)}</span>
        </div>
      </div>

      {/* Withdraw CTA */}
      <div className="flex flex-col gap-[0.375em]">
        <AppButton
          variant="primary"
          size="sm"
          onClick={onWithdraw}
          disabled={!bankingSetup || available === 0}
        >
          Withdraw funds
        </AppButton>
        {!bankingSetup && (
          <p className="text-[0.75em] text-text-muted font-body text-center">
            Add banking info in Settings to enable withdrawals.
          </p>
        )}
      </div>
    </div>
  );
}
