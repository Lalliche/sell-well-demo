"use client";

/**
 * FundReceipt — live receipt panel that updates as the user types and
 * picks a method. Lives on the right side of the page on desktop; stacks
 * under the form on mobile.
 *
 * The Wise / Mercury pattern: every keystroke updates fee + total +
 * lands-by date. The CTA carries the exact total ("Confirm and pay
 * 203,000 DZD") because that is the highest-trust button copy in
 * fintech (Stripe Checkout's signature pattern).
 *
 * Refundability is a persistent strip at the top of the receipt — not
 * a footer disclaimer. Adapted to SellWell's actual custody model:
 * we don't claim third-party trust, we name the operational fact
 * (refundable until reserved · we never spend without your approval).
 */

import { motion } from "motion/react";
import { ShieldCheck, Lock } from "lucide-react";
import AppButton from "@/components/ui/Buttons";
import AnimatedDzdNumber from "@/components/shared/analytics/AnimatedDzdNumber";
import InfoPopover from "@/components/shared/feedback/InfoPopover";
import { format as formatDZD } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

export default function FundReceipt({
  amount,
  fee,
  method,
  arrivalLabel,
  isValid,
  isPending,
  onConfirm,
  t,
  className,
}) {
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const total = safeAmount + (Number.isFinite(fee) ? fee : 0);
  const methodName = method ? t(`method.${method}.name`) : "—";

  return (
    <motion.aside
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "flex flex-col gap-[1em] bg-surface border border-border rounded-[0.75em] shadow-sm",
        "p-[1.25em]",
        className,
      )}
    >
      {/* Refundability strip — persistent visual mark, not a footnote */}
      <div className="flex items-start gap-[0.5em] -mx-[0.25em] px-[0.625em] py-[0.5em] rounded-[0.5em] bg-status-approved-bg border border-[#D9EAE0]">
        <ShieldCheck
          className="w-[1em] h-[1em] text-trend-positive shrink-0 mt-[0.125em]"
          strokeWidth={1.75}
        />
        <p className="text-[0.6875em] font-semibold text-trend-positive leading-[1.4]">
          {t("receipt.refundableStrip")}
        </p>
      </div>

      {/* Eyebrow */}
      <div className="flex items-center justify-between gap-[0.5em]">
        <span className="text-[0.6875em] font-semibold tracking-[0.08em] uppercase text-text-muted">
          {t("receipt.eyebrow")}
        </span>
        <Lock className="w-[0.8125em] h-[0.8125em] text-text-muted" strokeWidth={1.75} />
      </div>

      {/* Hero amount */}
      <div className="flex flex-col gap-[0.125em]">
        <span className="text-[0.6875em] font-semibold tracking-[0.06em] uppercase text-text-muted">
          {t("receipt.youAdd")}
        </span>
        <div className="flex items-baseline gap-[0.375em]">
          <AnimatedDzdNumber
            value={safeAmount}
            withSymbol={false}
            className="font-mono text-[2em] font-semibold tracking-[-0.02em] text-text leading-[1.05] tabular-nums"
          />
          <span className="font-mono text-[0.875em] font-semibold text-text-muted">
            DZD
          </span>
        </div>
      </div>

      {/* Itemized lines */}
      <div className="flex flex-col gap-[0.5em] pt-[0.875em] border-t border-border-light">
        <ReceiptRow
          label={t("receipt.method")}
          value={methodName}
          mono={false}
        />
        <ReceiptRow
          label={
            <span className="inline-flex items-center gap-[0.25em]">
              {t("receipt.fee")}
              <InfoPopover
                label={t("info.fee.label")}
                body={t("info.fee.body")}
                size="sm"
                align="right"
              />
            </span>
          }
          value={`${formatDZD(fee, { withSymbol: false })} DZD`}
          mono
        />
        <ReceiptRow
          label={t("receipt.arrival")}
          value={arrivalLabel ?? "—"}
          mono={false}
        />
      </div>

      {/* Total — emphasized */}
      <div className="flex items-baseline justify-between gap-[0.5em] pt-[0.875em] border-t border-border">
        <span className="text-[0.8125em] font-semibold text-text font-body">
          {t("receipt.youPay")}
        </span>
        <span className="font-mono text-[1.125em] font-semibold text-text tabular-nums">
          {formatDZD(total, { withSymbol: false })}
          <span className="text-[0.75em] text-text-muted font-mono ms-[0.375em]">
            DZD
          </span>
        </span>
      </div>

      {/* CTA — carries the total */}
      <AppButton
        variant="primary"
        size="lg"
        onClick={onConfirm}
        isLoading={isPending}
        disabled={!isValid || isPending}
        className="w-full"
      >
        <span className="inline-flex items-center justify-center gap-[0.5em]">
          <ShieldCheck className="w-[1em] h-[1em]" strokeWidth={1.75} />
          {isValid
            ? t("confirmWithTotal", { total: formatDZD(total, { withSymbol: false }) })
            : t("confirmFallback")}
        </span>
      </AppButton>

      {/* Authorization line */}
      <p className="text-[0.6875em] text-text-muted font-body leading-[1.5]">
        {t("receipt.authorization")}
      </p>
    </motion.aside>
  );
}

function ReceiptRow({ label, value, mono }) {
  return (
    <div className="flex items-baseline justify-between gap-[0.5em]">
      <span className="text-[0.75em] text-text-secondary font-body">
        {label}
      </span>
      <span
        className={cn(
          "text-[0.8125em] font-semibold text-text",
          mono ? "font-mono tabular-nums" : "font-body",
        )}
      >
        {value}
      </span>
    </div>
  );
}
