"use client";

/**
 * LeadInboxWalletHeader — composition shell for the wallet header on
 * `/leads`. Wraps the shared `CompanyWalletBand` (left) + the
 * `ReservationsActivityFeed` (right) in a 2-col grid.
 *
 * Both halves are independent components — the band lives in
 * `shared/analytics/` and is reused on `/escrow` standalone, the feed
 * is leads-inbox-specific and shows the latest wallet transactions
 * with type-coloured icons + relative time + AnimatePresence enter on
 * a new row.
 *
 * The grid switches to `grid-cols-1` below `lg` so both columns stack
 * cleanly on smaller widths.
 */

import CompanyWalletBand from "@/components/shared/analytics/CompanyWalletBand";
import ReservationsActivityFeed from "./ReservationsActivityFeed";

export default function LeadInboxWalletHeader({
  wallet,
  isLoading,
  debitAmount = null,
  onDebitAnimationDone,
  transactions = [],
  isLoadingTransactions,
}) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 lg:items-stretch gap-[1em]">
      <CompanyWalletBand
        wallet={wallet}
        isLoading={isLoading}
        debitAmount={debitAmount}
        onDebitAnimationDone={onDebitAnimationDone}
      />
      <div className="min-w-0 p-[1.25em] bg-surface border border-border-light rounded-[0.75em]">
        <ReservationsActivityFeed
          transactions={transactions}
          isLoading={isLoadingTransactions}
        />
      </div>
    </section>
  );
}
