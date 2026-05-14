"use client";

/**
 * ReservationsActivityFeed — compact transaction feed for the right
 * half of the wallet header. Pairs the wallet *state* (left) with the
 * wallet *flow* (right): every reserve/release/deposit shows up as a
 * row here, in real time.
 *
 * Pattern: Mercury / Brex / Pilot account-activity widget. 4-5 rows
 * max, newest-first, each row:
 *   - 2.25em circular icon coloured by transaction type
 *   - Amount (mono, signed, tabular-nums) + relative time underneath
 *   - Description (truncated) on the right
 *
 * Animation: when the freshest transaction's id changes (i.e. a new
 * row arrived after a Reserve & view), Framer Motion fades + slides
 * the top row in from -8px so the user sees the new entry land.
 *
 * Reuses `fetchTransactions` (already feeds the dashboard wallet
 * history). Empty state appears when the company hasn't transacted at
 * all — never happens in seed data, but defended for completeness.
 */

import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { format as formatDZD } from "@/lib/format/currency";
import { formatRelative } from "@/lib/format/relative-time";
import { cn } from "@/lib/utils";
import { TRANSACTION_TYPE_META as TYPE_META } from "@/components/shared/analytics/wallet-transaction-meta";

const ROW_LIMIT = 5;

export default function ReservationsActivityFeed({ transactions = [], isLoading }) {
  const t = useTranslations("Leads.companyInbox.activity");
  const tTime = useTranslations("Dashboard.Notifications.Time");

  if (isLoading) return <SkeletonFeed />;

  const rows = [...transactions]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, ROW_LIMIT);

  return (
    <div className="flex flex-col gap-[0.625em] min-w-0">
      <div className="flex items-baseline justify-between gap-[1em]">
        <span className="text-[0.6875em] font-semibold tracking-[0.08em] uppercase text-text-muted">
          {t("title")}
        </span>
        <span className="text-[0.6875em] text-text-muted">
          {t("countSubtitle", { count: transactions.length })}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="text-[0.8125em] text-text-muted py-[1em]">
          {t("empty")}
        </div>
      ) : (
        <ol className="flex flex-col gap-[0.125em]">
          <AnimatePresence initial={false}>
            {rows.map((tx, i) => (
              <ActivityRow
                key={tx.id}
                tx={tx}
                isFirst={i === 0}
                t={t}
                tTime={tTime}
              />
            ))}
          </AnimatePresence>
        </ol>
      )}
    </div>
  );
}

function ActivityRow({ tx, isFirst, t, tTime }) {
  const meta = TYPE_META[tx.type] ?? TYPE_META.deposit;
  const { Icon } = meta;
  const amount = formatDZD(Math.abs(tx.amount), { withSymbol: false });
  const isCredit = tx.amount > 0;
  const typeLabel = t(`type.${tx.type}`);

  return (
    <motion.li
      initial={isFirst ? { opacity: 0, y: -8 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="flex items-center gap-[0.625em] py-[0.375em]"
    >
      <span
        className={cn(
          "shrink-0 inline-flex items-center justify-center w-[2em] h-[2em] rounded-full",
          meta.bg,
        )}
      >
        <Icon className={cn("w-[0.875em] h-[0.875em]", meta.iconCls)} strokeWidth={1.75} />
      </span>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[0.75em] font-semibold text-text truncate">
          {typeLabel}
        </span>
        <span className="text-[0.6875em] text-text-muted truncate">
          {tx.description}
        </span>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span
          className={cn(
            "font-mono text-[0.8125em] font-semibold tabular-nums leading-tight",
            isCredit ? "text-trend-positive" : "text-text",
          )}
        >
          {meta.sign} {amount}
        </span>
        <span className="font-mono text-[0.6875em] text-text-muted tabular-nums leading-tight">
          {formatRelative(tx.created_at, tTime)}
        </span>
      </div>
    </motion.li>
  );
}

function SkeletonFeed() {
  return (
    <div className="flex flex-col gap-[0.5em]">
      <span className="block h-[0.75em] w-[8em] bg-bg-alt rounded-[0.25em] animate-[skeleton-pulse_1.4s_ease-in-out_infinite]" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-[0.625em] py-[0.375em]">
          <span className="block w-[2em] h-[2em] rounded-full bg-bg-alt animate-[skeleton-pulse_1.4s_ease-in-out_infinite]" />
          <span className="flex-1 h-[1em] bg-bg-alt rounded-[0.25em] animate-[skeleton-pulse_1.4s_ease-in-out_infinite]" />
          <span className="block w-[5em] h-[0.75em] bg-bg-alt rounded-[0.25em] animate-[skeleton-pulse_1.4s_ease-in-out_infinite]" />
        </div>
      ))}
    </div>
  );
}
