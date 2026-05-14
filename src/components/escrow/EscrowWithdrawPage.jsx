"use client";

/**
 * EscrowWithdrawPage — /escrow/withdraw (Phase 7.10 — full rebuild).
 *
 * Layout: tri-state ledger hero on top, then a two-column "live
 * receipt + inputs" body. Post-submit, the body transforms in-place
 * into the 5-stage WithdrawTimeline.
 *
 * Visual asymmetry from /escrow/fund (deliberate, per UX research):
 *   - Hero is a 3-row monospace ledger (Total / Pending / Available),
 *     not a single billboard balance. Pending is amber-tinted.
 *   - Steel-blue dominant. No green refund strip — withdraw is cooler.
 *   - Receipt is on the LEFT (mirroring fund), inputs on the RIGHT —
 *     the receipt is the trust signal here, not the form.
 *   - Estimated arrival is a date range ("Wed May 13 → Mon May 19"),
 *     not "2-5 days". Concrete dates outperform durations on every
 *     published trust test (Wise / Stripe).
 *   - CTA: "Review withdrawal" not "Withdraw" — verb signals deliberation.
 *   - Post-submit transforms in-place into a 5-stage timeline — Mercury /
 *     Airwallex pattern. Cancel link present until admin moves the row.
 *
 * Mock contract — `requestWithdrawal({...})` writes a WithdrawalRequest
 * with status=pending. `fetchWallet` then subtracts pending withdrawal
 * amounts from `available_balance` so the ledger reflects the freeze
 * instantly on refetch.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { requestWithdrawal, fetchWallet } from "@/lib/mock/escrow";
import { useToast } from "@/hooks/useToast";
import PageHeader from "@/components/shared/layout/PageHeader";
import TrustStrip from "@/components/shared/feedback/TrustStrip";
import AmountChips, { snapTo500 } from "@/components/shared/forms/AmountChips";
import AppButton from "@/components/ui/Buttons";
import { format as formatDZD } from "@/lib/format/currency";
import DestinationComposer, { isDestinationValid } from "./DestinationComposer";
import WithdrawLedgerHero from "./withdraw/WithdrawLedgerHero";
import WithdrawReceipt from "./withdraw/WithdrawReceipt";
import WithdrawTimeline from "./withdraw/WithdrawTimeline";
import {
  validateWithdrawAmount,
  estimatedArrivalRange,
} from "./withdraw/withdraw-helpers";

const CHIPS = [2000, 5000, 10000, 15000, 20000, 30000];
const DEFAULT_CHIP = 5000;
const MIN_AMOUNT = 1000;

export default function EscrowWithdrawPage() {
  const t = useTranslations("Escrow.withdraw");
  const router = useRouter();
  const locale = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, ready } = useAuth();
  const userId = user?.id ?? null;
  const companyId = user?.role === "company" ? (user.profile?.id ?? user?.id) : null;
  const enabled = ready && !!companyId;

  const [amount, setAmount] = useState(null);
  const [destination, setDestination] = useState({ method: "ccp", snapshot: {} });
  const [submitted, setSubmitted] = useState(null); // WithdrawalRequest after submit

  const { data: wallet } = useQuery({
    queryKey: ["wallet", companyId],
    queryFn: () => fetchWallet({ companyId }),
    enabled,
  });
  const available = wallet?.available_balance ?? 0;

  const validation = validateWithdrawAmount({
    amount,
    available,
    min: MIN_AMOUNT,
    formatDZD,
    t,
  });
  const destValid = isDestinationValid(destination);
  const arrivalRange = estimatedArrivalRange(locale);

  const destinationLabel = destValid
    ? formatDestinationLabel(destination, t)
    : null;

  const mutation = useMutation({
    mutationFn: (payload) =>
      requestWithdrawal({ companyId, userId, ...payload }),
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      toast.success(t("toast.successBody", { amount: formatDZD(amount) }), {
        title: t("toast.successTitle"),
      });
      setSubmitted(row);
    },
    onError: () => {
      toast.error(t("toast.errorBody"), { title: t("toast.errorTitle") });
    },
  });

  const canSubmit = validation.valid && destValid && !mutation.isPending;

  const handleConfirm = () => {
    if (!canSubmit) return;
    mutation.mutate({
      amount,
      payout_method: destination.method,
      destination_snapshot: destination.snapshot,
    });
  };

  const handleDone = () => router.push("/escrow");

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
        icon={Clock}
        title={t("trustStrip.title")}
        body={t("trustStrip.body")}
      />

      <WithdrawLedgerHero wallet={wallet} t={t} />

      {submitted ? (
        <WithdrawTimeline
          withdrawal={submitted}
          arrivalRange={arrivalRange}
          destinationLabel={destinationLabel}
          onDone={handleDone}
          t={t}
        />
      ) : (
        <div className="flex flex-col lg:flex-row-reverse gap-[1.25em] items-start w-full">
          {/* Inputs panel — right column on desktop (~62%). Percentages so
              the sidebar collapse/expand doesn't leave a margin. */}
          <section className="flex flex-col gap-[1.25em] p-[1.5em] bg-surface border border-border-light rounded-[0.75em] w-full lg:basis-[48%] lg:flex-1 min-w-0">
            <div className="flex flex-col gap-[0.625em]">
              <span className="text-[0.6875em] font-semibold tracking-[0.06em] uppercase text-text-muted">
                {t("amountLabel")}
              </span>
              <AmountChips
                chips={CHIPS}
                value={amount}
                onChange={setAmount}
                defaultChip={DEFAULT_CHIP}
                min={MIN_AMOUNT}
                customLabel={t("customLabel")}
                inputPlaceholder={t("customPlaceholder")}
                helperText={
                  validation.error
                    ? null
                    : t("customHelper", { min: formatDZD(MIN_AMOUNT) })
                }
                error={validation.error}
              />
              <button
                type="button"
                onClick={() => setAmount(snapTo500(available))}
                className="self-start text-[0.75em] font-semibold text-accent-text hover:text-accent transition-colors duration-150 ease-out"
              >
                {t("fillMax", { amount: formatDZD(available) })}
              </button>
            </div>

            <div className="flex flex-col gap-[0.625em]">
              <span className="text-[0.6875em] font-semibold tracking-[0.06em] uppercase text-text-muted">
                {t("destinationLabel")}
              </span>
              <DestinationComposer
                value={destination}
                onChange={setDestination}
                t={t}
              />
            </div>

            <AppButton
              variant="primary"
              size="lg"
              onClick={handleConfirm}
              isLoading={mutation.isPending}
              disabled={!canSubmit}
              className="w-full"
            >
              <span className="inline-flex items-center justify-center gap-[0.5em]">
                <Clock className="w-[1em] h-[1em]" strokeWidth={1.75} />
                {t("confirm")}
              </span>
            </AppButton>
          </section>

          {/* Live receipt — left column on desktop (~38%). */}
          <WithdrawReceipt
            amount={amount}
            available={available}
            destinationLabel={destinationLabel}
            arrivalRange={arrivalRange}
            t={t}
            className="w-full lg:basis-[52%] lg:flex-1 min-w-0 lg:sticky lg:top-[2em]"
          />
        </div>
      )}
    </div>
  );
}

/** Format a destination snapshot to a single-line label for the receipt
 *  + timeline. CCP shows last 4 of account; bank shows name + last 4 of RIB. */
function formatDestinationLabel(destination, t) {
  const { method, snapshot } = destination;
  if (method === "ccp") {
    const last4 = (snapshot.ccp_account ?? "").slice(-4);
    return t("destLabel.ccp", { last4 });
  }
  if (method === "bank") {
    const last4 = (snapshot.rib ?? "").replace(/\s/g, "").slice(-4);
    return t("destLabel.bank", {
      bank: snapshot.bank_name ?? "—",
      last4,
    });
  }
  return null;
}
