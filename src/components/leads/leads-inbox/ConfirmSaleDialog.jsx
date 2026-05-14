"use client";

/**
 * ConfirmSaleDialog — Vault Receipt v2 for the "Confirm sale" action.
 *
 * The sale amount is FIXED at the agreed tier price — the company
 * cannot edit it at confirm time. The displayed values come straight
 * from the lead's existing `commission_amount` + `platform_fee_amount`
 * (computed at lead creation against the tier price).
 *
 * Pattern: same trust spine as ReserveConfirmDialog (steel-blue/green
 * shield headline + IBM Plex Mono amounts + persistent green release
 * strip + inline T&Cs link).
 */

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CheckCircle2, Send } from "lucide-react";
import AppButton from "@/components/ui/Buttons";
import { format as formatDZD } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

export default function ConfirmSaleDialog({
  open,
  onCancel,
  onConfirm,
  lead,
  isPending,
}) {
  const t = useTranslations("Leads.companyInbox.confirmSale");

  const handleCancel = useCallback(() => {
    if (isPending) return;
    onCancel?.();
  }, [isPending, onCancel]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") handleCancel(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, handleCancel]);

  if (!open || !lead) return null;

  // All values come straight from the lead — no recomputation, no
  // override. Sale amount = tier price; commission + platform fee
  // were stamped at submission time and don't change at confirm.
  const tierPrice = lead.pricing_tier_resolved?.price ?? 0;
  const commission = lead.commission_amount ?? 0;
  const platformFee = lead.platform_fee_amount ?? 0;
  const totalReleased = commission + platformFee;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-[1em]">
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(26,26,26,0.4)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          animation: "fade-in 0.15s ease-out",
        }}
        onClick={handleCancel}
      />

      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-sale-title"
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="relative bg-surface rounded-[0.75em] shadow-xl w-full max-w-[30em] p-[1.75em] flex flex-col gap-[1.25em] max-h-[90vh] overflow-y-auto"
      >
        {/* Headline — green check + 'Confirm the sale' */}
        <div className="flex items-start gap-[0.75em]">
          <span className="shrink-0 inline-flex items-center justify-center w-[2.5em] h-[2.5em] rounded-full bg-status-approved-bg text-status-approved-text">
            <CheckCircle2 className="w-[1.25em] h-[1.25em]" strokeWidth={1.75} />
          </span>
          <div className="flex flex-col gap-[0.125em] min-w-0 flex-1 pt-[0.125em]">
            <h2
              id="confirm-sale-title"
              className="font-heading text-[1.125em] font-bold tracking-[-0.01em] text-text leading-tight"
            >
              {t("headline")}
            </h2>
            <p className="text-[0.8125em] text-text-secondary font-body leading-snug">
              {t("subheadline", { name: lead.client_full_name ?? t("thisLead") })}
            </p>
          </div>
        </div>

        {/* Hero — sale amount restated */}
        <div className="flex flex-col gap-[0.125em] items-center text-center py-[0.5em]">
          <span className="text-[0.6875em] font-semibold tracking-[0.08em] uppercase text-text-muted">
            {t("saleAmountLabel")}
          </span>
          <span className="font-mono text-[2em] font-semibold tracking-[-0.02em] text-text leading-[1.05]">
            {formatDZD(tierPrice)}
          </span>
        </div>

        {/* Breakdown — Commission + Platform fee + Total */}
        <div className="flex flex-col gap-[0.5em] p-[0.875em] rounded-[0.625em] bg-bg-alt">
          <BreakdownRow label={t("commission")} value={formatDZD(commission)} />
          <BreakdownRow label={t("platformFee")} value={formatDZD(platformFee)} />
          <span className="h-px bg-border-light my-[0.125em]" />
          <BreakdownRow label={t("totalReleased")} value={formatDZD(totalReleased)} bold />
        </div>

        {/* Release strip — what happens on confirm. */}
        <div className="flex items-start gap-[0.625em] p-[0.875em] rounded-[0.625em] bg-status-approved-bg border border-status-approved-text/15">
          <Send
            className="w-[1em] h-[1em] text-status-approved-text shrink-0 mt-[0.125em]"
            strokeWidth={1.75}
          />
          <p className="text-[0.8125em] text-status-approved-text font-body leading-[1.5]">
            {t("releaseStrip")}
          </p>
        </div>

        {/* T&Cs inline link */}
        <p className="text-[0.75em] text-text-muted font-body leading-[1.55] text-center">
          {t.rich("tcs", {
            link: (chunks) => (
              <Link
                href="/terms"
                className="text-accent-text hover:text-accent underline underline-offset-2 transition-colors duration-150"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-end gap-[0.5em]">
          <AppButton variant="ghost" size="md" onClick={handleCancel} disabled={isPending}>
            {t("cancel")}
          </AppButton>
          <AppButton
            variant="primary"
            size="md"
            onClick={() => onConfirm?.(tierPrice)}
            isLoading={isPending}
            disabled={isPending}
          >
            <span className="inline-flex items-center gap-[0.375em]">
              <CheckCircle2 className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
              {t("confirm")}
            </span>
          </AppButton>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

function BreakdownRow({ label, value, bold }) {
  return (
    <div className="flex items-baseline justify-between gap-[1em]">
      <span className="text-[0.8125em] font-body text-text-secondary">{label}</span>
      <span
        className={cn(
          "font-mono tabular-nums text-[0.875em] text-text",
          bold ? "font-semibold" : "font-medium",
        )}
      >
        {value}
      </span>
    </div>
  );
}
