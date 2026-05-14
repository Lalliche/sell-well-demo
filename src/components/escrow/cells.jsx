"use client";

/**
 * Cell components for the /escrow page tables.
 *
 * Reuses TRANSACTION_TYPE_META so type icons + tones match the
 * /leads activity feed exactly. Related-lead deep-links open
 * /leads?open=<id> (the same overlay-deep-link pattern we already
 * built in 7.6).
 */

import { Link as IntlLink } from "@/i18n/navigation";
import { Download, ArrowUpRight } from "lucide-react";
import StatusBadge from "@/components/shared/data-display/StatusBadge";
import { format as formatDZD } from "@/lib/format/currency";
import { TRANSACTION_TYPE_META } from "@/components/shared/analytics/wallet-transaction-meta";
import { cn } from "@/lib/utils";

/** Type cell — circular icon disc + localized type label. */
export function TransactionTypeCell({ type, t }) {
  const meta = TRANSACTION_TYPE_META[type] ?? TRANSACTION_TYPE_META.deposit;
  const { Icon } = meta;
  return (
    <div className="flex items-center gap-[0.625em] min-w-0">
      <span
        className={cn(
          "shrink-0 inline-flex items-center justify-center w-[1.75em] h-[1.75em] rounded-full",
          meta.bg,
        )}
      >
        <Icon className={cn("w-[0.75em] h-[0.75em]", meta.iconCls)} strokeWidth={1.75} />
      </span>
      <span className="text-[0.8125em] font-medium text-text truncate">
        {t(type)}
      </span>
    </div>
  );
}

/** Signed mono amount cell. Credits (+) tinted green; debits (−) text. */
export function TransactionAmountCell({ amount, type }) {
  const meta = TRANSACTION_TYPE_META[type] ?? TRANSACTION_TYPE_META.deposit;
  const isCredit = amount > 0;
  return (
    <span
      className={cn(
        "font-mono text-[0.8125em] font-semibold tabular-nums whitespace-nowrap",
        isCredit ? "text-trend-positive" : "text-text",
      )}
    >
      {meta.sign} {formatDZD(Math.abs(amount), { withSymbol: false })}
    </span>
  );
}

/** Related-lead deep-link. Renders as a small "Lead #id" pill that
 *  opens /leads?open=<id>. Empty for transactions not tied to a lead
 *  (deposits, generic withdrawals). */
export function RelatedLeadCell({ leadId, t }) {
  if (typeof leadId !== "number") {
    return <span className="text-[0.75em] text-text-muted">—</span>;
  }
  return (
    <IntlLink
      href={`/leads?open=${leadId}`}
      className="inline-flex items-center gap-[0.25em] text-[0.75em] font-medium text-accent-text hover:text-accent transition-colors duration-150 ease-out whitespace-nowrap"
    >
      <span>{t("leadRef", { id: leadId })}</span>
      <ArrowUpRight className="w-[0.75em] h-[0.75em]" strokeWidth={1.75} />
    </IntlLink>
  );
}

/** Proof-document download cell — only renders an icon link on
 *  completed withdrawals (per the spec, proof is required when
 *  status flips to completed). */
export function ProofDownloadCell({ proof, t }) {
  if (!proof) return <span className="text-[0.75em] text-text-muted">—</span>;
  return (
    <a
      href={proof}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-[0.375em] text-[0.75em] font-semibold text-accent-text hover:text-accent transition-colors duration-150 ease-out whitespace-nowrap"
    >
      <Download className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
      {t("proof")}
    </a>
  );
}

/** Withdrawal status cell — reuses StatusBadge with the proper status
 *  string. The badge already has tones for pending/approved/rejected;
 *  "processing" + "completed" map cleanly via the badge's own table. */
export function WithdrawalStatusCell({ status }) {
  return <StatusBadge status={status} />;
}
