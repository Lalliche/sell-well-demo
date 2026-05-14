"use client";

/**
 * EscrowFundPage — /escrow/fund (Phase 7.9 — full rebuild).
 *
 * Layout: "The Receipt" — form left (2/3), sticky live receipt right (1/3).
 * Pattern from Wise / Mercury / Stripe Checkout. The form is the body;
 * the receipt is the consequence engine. Every keystroke updates fee,
 * total, lands-by date in real time on the right rail.
 *
 * Trust strip at top frames refundability + control (the honest signal,
 * since SellWell holds custody — not a third-party bank).
 *
 * Pattern stack:
 *   - Method-first ordering: payment-method tiles render BEFORE the
 *     amount picker (every serious fintech leads with the rail).
 *   - Per-method ETA + Fee + Limit triplet on every tile (Wise pattern).
 *   - Chargily 1.5% fee shown both on tile + receipt line (transparency).
 *   - CTA in the receipt carries the exact total ("Confirm and pay X DZD") —
 *     Stripe Checkout's signature trust pattern.
 *   - InfoPopovers on every "scary" word (Fee, Refundable) — Coinbase pattern.
 *
 * Mock contract — `fundWallet({companyId, amount})` writes a deposit
 * WalletTransaction. Backend swap routes the same payload through
 * Chargily Pay's checkout endpoint.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { fundWallet, fetchWallet } from "@/lib/mock/escrow";
import { useToast } from "@/hooks/useToast";
import PageHeader from "@/components/shared/layout/PageHeader";
import TrustStrip from "@/components/shared/feedback/TrustStrip";
import AmountChips from "@/components/shared/forms/AmountChips";
import { format as formatDZD } from "@/lib/format/currency";
import FundMethodTile from "./fund/FundMethodTile";
import FundReceipt from "./fund/FundReceipt";
import {
  FUND_METHOD_KEYS,
  computeFundFee,
  estimatedArrivalLabel,
  validateFundAmount,
} from "./fund/fund-helpers";

const CHIPS = [2000, 5000, 10000, 15000, 20000, 30000];
const DEFAULT_CHIP = 5000;

export default function EscrowFundPage() {
  const t = useTranslations("Escrow.fund");
  const router = useRouter();
  const locale = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, ready } = useAuth();
  const companyId = user?.role === "company" ? (user.profile?.id ?? user?.id) : null;
  const enabled = ready && !!companyId;

  const [amount, setAmount] = useState(null);
  const [method, setMethod] = useState("cib");

  const { data: wallet } = useQuery({
    queryKey: ["wallet", companyId],
    queryFn: () => fetchWallet({ companyId }),
    enabled,
  });

  const validation = validateFundAmount({ amount, method, formatDZD, t });
  const fee = computeFundFee(validation.valid ? amount : 0, method);
  const arrivalLabel = estimatedArrivalLabel(method, locale);

  const mutation = useMutation({
    mutationFn: ({ amount }) => fundWallet({ companyId, amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(t("toast.successBody", { amount: formatDZD(amount) }), {
        title: t("toast.successTitle"),
      });
      router.push("/escrow");
    },
    onError: () => {
      toast.error(t("toast.errorBody"), { title: t("toast.errorTitle") });
    },
  });

  const handleConfirm = () => {
    if (!validation.valid) return;
    mutation.mutate({ amount });
  };

  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[1.25em]">
      <Link
        href="/escrow"
        className="inline-flex items-center gap-[0.375em] text-[0.8125em] text-text-muted hover:text-text transition-colors duration-150 ease-out self-start"
      >
        <ArrowLeft className="w-[1em] h-[1em]" strokeWidth={1.5} />
        <span>{t("back")}</span>
      </Link>

      <PageHeader title={t("title")} description={t("description")} />

      <TrustStrip
        icon={ShieldCheck}
        title={t("trustStrip.title")}
        body={t("trustStrip.body")}
      />

      {/* The Receipt layout — form left (~62%), sticky receipt right (~38%).
          Both children grow fluidly so the sidebar collapse/expand doesn't
          leave a margin — percentages, not em. */}
      <div className="flex flex-col lg:flex-row gap-[1.25em] items-start w-full">
        <section className="flex flex-col gap-[1.25em] p-[1.5em] bg-surface border border-border-light rounded-[0.75em] w-full lg:basis-[48%] lg:flex-1 min-w-0">
          {/* Method first (research: every serious flow leads with rail) */}
          <div className="flex flex-col gap-[0.625em]">
            <span className="text-[0.6875em] font-semibold tracking-[0.06em] uppercase text-text-muted">
              {t("methodLabel")}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[0.625em]">
              {FUND_METHOD_KEYS.map((m) => (
                <FundMethodTile
                  key={m}
                  method={m}
                  active={method === m}
                  onClick={() => setMethod(m)}
                  t={t}
                />
              ))}
            </div>
          </div>

          {/* Amount second */}
          <div className="flex flex-col gap-[0.625em]">
            <span className="text-[0.6875em] font-semibold tracking-[0.06em] uppercase text-text-muted">
              {t("amountLabel")}
            </span>
            <AmountChips
              chips={CHIPS}
              value={amount}
              onChange={setAmount}
              defaultChip={DEFAULT_CHIP}
              min={1000}
              customLabel={t("customLabel")}
              inputPlaceholder={t("customPlaceholder")}
              helperText={
                validation.error
                  ? null
                  : t("customHelper", { min: formatDZD(1000) })
              }
              error={validation.error}
            />
          </div>

          {/* Wallet snapshot — small, low-emphasis, just so the user sees their
              starting point. NOT the full wallet band (research: don't reuse
              the band on funding pages — it's the wrong primary action). */}
          {wallet && (
            <div className="flex items-center justify-between gap-[0.5em] p-[0.75em] rounded-[0.5em] bg-bg-alt">
              <span className="text-[0.75em] text-text-muted font-body">
                {t("currentBalance")}
              </span>
              <span className="font-mono text-[0.875em] font-semibold text-text tabular-nums">
                {formatDZD(wallet.available_balance ?? 0)}
              </span>
            </div>
          )}
        </section>

        <FundReceipt
          amount={amount}
          fee={fee}
          method={method}
          arrivalLabel={arrivalLabel}
          isValid={validation.valid}
          isPending={mutation.isPending}
          onConfirm={handleConfirm}
          t={t}
          className="w-full lg:basis-[52%] lg:flex-1 min-w-0 lg:sticky lg:top-[2em]"
        />
      </div>
    </div>
  );
}
