"use client";

/**
 * EscrowPage — company-side /escrow view (Phase 7.8).
 *
 * Layout (top → bottom):
 *   1. PageHeader.
 *   2. CompanyWalletBand (full-width). Reuses the shared band primitive
 *      that /leads also consumes — same Vault Meter aesthetic + synced
 *      Framer Motion animations on Available + partition bar.
 *   3. Wallet history DataTable. Filter chips by transaction type
 *      ("All / Deposits / Reservations / Releases / Returns / Withdrawals").
 *      Newest-first, paginated.
 *   4. WithdrawalRequestsSection — separate table for the four-state
 *      lifecycle (pending / processing / completed / rejected) with
 *      proof-document download links on completed rows. Per the
 *      escrow-leads spec, this is distinct from wallet transactions
 *      because the request itself is not a money-movement event.
 *
 * Reuses the wallet/transactions queries already wired in /leads and
 * adds a third for `fetchWithdrawalRequests` keyed by user.id.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { FiInbox, FiLock, FiSend, FiRotateCcw } from "react-icons/fi";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  fetchWallet,
  fetchTransactions,
  fetchWithdrawalRequests,
} from "@/lib/mock/escrow";
import PageHeader from "@/components/shared/layout/PageHeader";
import DataTable from "@/components/shared/data-display/DataTable";
import StatusTabs from "@/components/shared/data-display/StatusTabs";
import EmptyState from "@/components/shared/feedback/EmptyState";
import CompanyWalletBand from "@/components/shared/analytics/CompanyWalletBand";
import { buildTransactionsColumns } from "./transactions-table-columns";
import WithdrawalRequestsSection from "./WithdrawalRequestsSection";

const TYPE_TABS = ["all", "deposit", "reservation", "release", "return", "withdrawal"];
const TYPE_TAB_ICONS = {
  all: FiInbox,
  deposit: ArrowDownToLine,
  reservation: FiLock,
  release: FiSend,
  return: FiRotateCcw,
  withdrawal: ArrowUpFromLine,
};

// Map filter chip → set of WalletTransactionType values.
const TYPE_TAB_MATCH = {
  all: null,
  deposit: ["deposit"],
  reservation: ["reservation"],
  release: ["release_commission", "release_platform_fee"],
  return: ["return"],
  withdrawal: ["withdrawal"],
};

export default function EscrowPage() {
  const t = useTranslations("Escrow");
  const tHistory = useTranslations("Escrow.history");
  const tHistoryTable = useTranslations("Escrow.history.table");
  const tType = useTranslations("Leads.companyInbox.activity.type");
  const tRelated = useTranslations("Escrow.history");
  const locale = useLocale();
  const { user, ready } = useAuth();
  const userId = user?.id ?? null;
  const companyId = user?.role === "company" ? (user.profile?.id ?? user?.id) : null;
  const enabled = ready && !!companyId;

  const [activeTypeTab, setActiveTypeTab] = useState("all");

  const { data: wallet } = useQuery({
    queryKey: ["wallet", companyId],
    queryFn: () => fetchWallet({ companyId }),
    enabled,
  });

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["transactions", companyId, "all"],
    queryFn: () => fetchTransactions({ companyId }),
    enabled,
  });

  const { data: withdrawals = [], isLoading: isLoadingWithdrawals } = useQuery({
    queryKey: ["withdrawals", userId],
    queryFn: () => fetchWithdrawalRequests({ userId }),
    enabled: ready && !!userId,
  });

  // Type-tab filter + counts.
  const counts = useMemo(() => {
    const c = { all: transactions.length };
    for (const key of TYPE_TABS) {
      if (key === "all") continue;
      const match = TYPE_TAB_MATCH[key];
      c[key] = transactions.filter((tx) => match.includes(tx.type)).length;
    }
    return c;
  }, [transactions]);

  const visibleTransactions = useMemo(() => {
    const match = TYPE_TAB_MATCH[activeTypeTab];
    if (!match) return transactions;
    return transactions.filter((tx) => match.includes(tx.type));
  }, [transactions, activeTypeTab]);

  const columns = useMemo(
    () =>
      buildTransactionsColumns({
        locale,
        tTable: tHistoryTable,
        tType,
        tRelated,
      }),
    [locale, tHistoryTable, tType, tRelated],
  );

  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[1.5em]">
      <PageHeader title={t("title")} description={t("description")} />

      <CompanyWalletBand wallet={wallet} />

      {/* Wallet history */}
      <section className="flex flex-col gap-[0.875em]">
        <header className="flex items-baseline justify-between gap-[1em]">
          <h2 className="font-heading text-[1.125em] font-semibold tracking-[-0.01em] text-text">
            {tHistory("title")}
          </h2>
          <span className="text-[0.75em] text-text-muted">
            {tHistory("countSubtitle", { count: transactions.length })}
          </span>
        </header>

        <StatusTabs
          tabs={TYPE_TABS.map((key) => ({
            key,
            label: tHistory(`tabs.${key}`),
            icon: TYPE_TAB_ICONS[key],
          }))}
          activeKey={activeTypeTab}
          onChange={setActiveTypeTab}
          counts={counts}
        />

        {visibleTransactions.length === 0 && !isLoadingTransactions ? (
          <div className="bg-surface border border-border-light rounded-[0.625em] shadow-xs">
            <EmptyState
              icon={<FiInbox strokeWidth={1.5} />}
              title={tHistory("empty.title")}
              subtitle={tHistory("empty.body")}
            />
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={visibleTransactions}
            isLoading={isLoadingTransactions}
            pageSize={10}
          />
        )}
      </section>

      <WithdrawalRequestsSection
        withdrawals={withdrawals}
        isLoading={isLoadingWithdrawals}
      />
    </div>
  );
}
