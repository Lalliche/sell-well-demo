"use client";

/**
 * WithdrawReceipt — left-column live receipt that updates as the user
 * types and edits destination. The Wise / Mercury "send money" pattern,
 * adapted for the cooler withdraw aesthetic. Steel-blue dominant, no
 * green refund strip.
 *
 * Two distinct trust signals:
 *   1. "Available after this request" — quietly shows the user how
 *      this withdrawal affects their reservable runway. The freeze
 *      is communicated via the math, not via alarmist language.
 *   2. Estimated arrival as a date range ("Wed May 13 — Mon May 19")
 *      not a duration. Concrete dates outperform "2-5 days" on every
 *      published trust test.
 *
 * No CTA in this panel — the inputs panel on the right side owns the
 * primary action. This receipt mirrors the data, the inputs drive it.
 */

import { motion } from "motion/react";
import { Clock } from "lucide-react";
import AnimatedDzdNumber from "@/components/shared/analytics/AnimatedDzdNumber";
import InfoPopover from "@/components/shared/feedback/InfoPopover";
import { format as formatDZD } from "@/lib/format/currency";
import { cn } from "@/lib/utils";
import { TIMELINE_STAGES } from "./withdraw-helpers";

export default function WithdrawReceipt({
  amount,
  available,
  destinationLabel,
  arrivalRange,
  t,
  className,
}) {
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const availableAfter = Math.max(0, (available ?? 0) - safeAmount);

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
      {/* Eyebrow */}
      <div className="flex items-center justify-between gap-[0.5em]">
        <span className="text-[0.6875em] font-semibold tracking-[0.08em] uppercase text-text-muted">
          {t("receipt.eyebrow")}
        </span>
        <Clock className="w-[0.8125em] h-[0.8125em] text-text-muted" strokeWidth={1.75} />
      </div>

      {/* Hero amount */}
      <div className="flex flex-col gap-[0.125em]">
        <span className="text-[0.6875em] font-semibold tracking-[0.06em] uppercase text-text-muted">
          {t("receipt.youWithdraw")}
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
          label={t("receipt.destination")}
          value={destinationLabel ?? "—"}
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
          value={`${formatDZD(0, { withSymbol: false })} DZD`}
          mono
        />
        <ReceiptRow
          label={
            <span className="inline-flex items-center gap-[0.25em]">
              {t("receipt.lands")}
              <InfoPopover
                label={t("info.processing.label")}
                body={t("info.processing.body")}
                size="sm"
                align="right"
              />
            </span>
          }
          value={
            arrivalRange
              ? `${arrivalRange.from} → ${arrivalRange.to}`
              : "—"
          }
          mono={false}
        />
      </div>

      {/* Totals — what they receive vs what's left */}
      <div className="flex flex-col gap-[0.5em] pt-[0.875em] border-t border-border">
        <div className="flex items-baseline justify-between gap-[0.5em]">
          <span className="text-[0.8125em] font-semibold text-text font-body">
            {t("receipt.youReceive")}
          </span>
          <span className="font-mono text-[1.125em] font-semibold text-text tabular-nums">
            {formatDZD(safeAmount, { withSymbol: false })}
            <span className="text-[0.75em] text-text-muted font-mono ms-[0.375em]">
              DZD
            </span>
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-[0.5em]">
          <span className="text-[0.75em] text-text-muted font-body">
            {t("receipt.availableAfter")}
          </span>
          <span className="font-mono text-[0.8125em] font-semibold text-text-secondary tabular-nums">
            {formatDZD(availableAfter, { withSymbol: false })}
            <span className="text-[0.6875em] text-text-muted font-mono ms-[0.25em]">
              DZD
            </span>
          </span>
        </div>
      </div>

      {/* Tiny "process preview" — abbreviated 5-stage timeline */}
      <div className="flex flex-col gap-[0.5em] pt-[0.875em] border-t border-border-light">
        <span className="text-[0.6875em] font-semibold tracking-[0.06em] uppercase text-text-muted">
          {t("receipt.processPreview")}
        </span>
        <div className="flex items-center gap-[0.375em] flex-wrap">
          {TIMELINE_STAGES.map((stage, i) => (
            <span key={stage} className="inline-flex items-center gap-[0.375em]">
              <span className="text-[0.6875em] text-text-secondary font-body">
                {t(`timeline.stages.${stage}.label`)}
              </span>
              {i < TIMELINE_STAGES.length - 1 && (
                <span className="text-text-muted text-[0.6875em]">→</span>
              )}
            </span>
          ))}
        </div>
      </div>
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
