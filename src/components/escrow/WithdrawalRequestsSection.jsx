"use client";

/**
 * WithdrawalRequestsSection — secondary table on /escrow showing all
 * `WithdrawalRequest` rows for the company. Renders the four lifecycle
 * states (pending / processing / completed / rejected) with:
 *   - Date · Amount · Method · Status · Proof (download link on
 *     completed) · Reason (small caption on rejected rows).
 *
 * Per the spec, withdrawals are MANUAL: the user submits a request,
 * admin disburses offline, then admin uploads proof + flips status to
 * completed. The request itself is NOT a WalletTransaction — it's a
 * separate row class that lives in this section. The corresponding
 * `withdrawal` WalletTransaction (if any) appears in the main wallet
 * history table above.
 *
 * Reuses the shared `DataTable`. Empty state when the company has
 * never requested a withdrawal.
 */

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FiDollarSign } from "react-icons/fi";
import DataTable from "@/components/shared/data-display/DataTable";
import EmptyState from "@/components/shared/feedback/EmptyState";
import { format as formatDZD } from "@/lib/format/currency";
import { ProofDownloadCell, WithdrawalStatusCell } from "./cells";

export default function WithdrawalRequestsSection({ withdrawals = [], isLoading }) {
  const t = useTranslations("Escrow.withdrawals");
  const locale = useLocale();

  const columns = useMemo(
    () => [
      {
        key: "requested_at",
        label: t("table.date"),
        sortable: true,
        width: "10em",
        render: (v) => (
          <span className="font-mono text-[0.75em] tabular-nums text-text-secondary whitespace-nowrap">
            {new Date(v).toLocaleDateString(locale, {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        ),
      },
      {
        key: "amount",
        label: t("table.amount"),
        sortable: true,
        width: "8em",
        render: (v) => (
          <span className="font-mono text-[0.8125em] font-semibold tabular-nums text-text whitespace-nowrap">
            {formatDZD(v)}
          </span>
        ),
      },
      {
        key: "payout_method",
        label: t("table.method"),
        sortable: false,
        width: "7em",
        render: (v) => (
          <span className="text-[0.75em] uppercase tracking-[0.06em] font-semibold text-text-muted">
            {v}
          </span>
        ),
      },
      {
        key: "status",
        label: t("table.status"),
        sortable: false,
        width: "9em",
        render: (v) => <WithdrawalStatusCell status={v} />,
      },
      {
        key: "proof_document",
        label: t("table.proof"),
        sortable: false,
        width: "7em",
        render: (v) => <ProofDownloadCell proof={v} t={t} />,
      },
      {
        key: "admin_notes",
        label: t("table.notes"),
        sortable: false,
        render: (v) =>
          v ? (
            <span className="text-[0.75em] text-text-muted truncate font-body">
              {v}
            </span>
          ) : (
            <span className="text-[0.75em] text-text-muted">—</span>
          ),
      },
    ],
    [t, locale],
  );

  return (
    <section className="flex flex-col gap-[0.875em]">
      <header className="flex items-baseline justify-between gap-[1em]">
        <h2 className="font-heading text-[1.125em] font-semibold tracking-[-0.01em] text-text">
          {t("title")}
        </h2>
        <span className="text-[0.75em] text-text-muted">
          {t("countSubtitle", { count: withdrawals.length })}
        </span>
      </header>

      {withdrawals.length === 0 && !isLoading ? (
        <div className="bg-surface border border-border-light rounded-[0.625em] shadow-xs">
          <EmptyState
            icon={<FiDollarSign strokeWidth={1.5} />}
            title={t("empty.title")}
            subtitle={t("empty.body")}
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={withdrawals}
          isLoading={isLoading}
          pageSize={5}
        />
      )}
    </section>
  );
}
