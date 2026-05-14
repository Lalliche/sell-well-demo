"use client";

/**
 * ReserveConfirmDialog — Vault Receipt pattern (UX research).
 *
 * Bespoke component (NOT the shared ConfirmDialog) because the
 * information hierarchy here is load-bearing for trust:
 *
 *   1. Steel-blue shield + headline    "Held in escrow, not spent"
 *   2. Restated frozen amount          (IBM Plex Mono, hero size)
 *   3. Breakdown rows                  Commission · Platform fee · Total
 *   4. Available before / after        (amber if negative)
 *   5. Persistent green refund strip   "Returns to your wallet if the deal
 *                                       doesn't close within {N} days."
 *   6. Inline T&Cs link                "By reserving, you accept the
 *                                       Escrow Terms" (link → /terms)
 *   7. CTA: Reserve & view            (or Top up wallet on insufficient)
 *
 * Motion: card scales 0.96 → 1 + y-rises 8 → 0 on entry (220ms ease-out),
 * backdrop fades. Reuses fade-in / scale-in keyframes already defined in
 * globals.css. Re-uses createPortal pattern from ConfirmDialog.
 *
 * Insufficient-funds branch: replaces the primary CTA with a "Top up
 * wallet" link to /escrow/fund. Cancel + the Vault Receipt content
 * stay the same so the user understands exactly why they're blocked.
 */

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ShieldCheck, RotateCcw, Lock } from "lucide-react";
import AppButton from "@/components/ui/Buttons";
import { format as formatDZD } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

export default function ReserveConfirmDialog({
  open,
  onCancel,
  onConfirm,
  lead,
  available,
  isPending,
}) {
  const t = useTranslations("Leads.companyInbox.reserveConfirm");

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

  const reservation = lead.total_reservation ?? 0;
  const commission = lead.commission_amount ?? 0;
  const platformFee = lead.platform_fee_amount ?? 0;
  const after = (available ?? 0) - reservation;
  const insufficient = after < 0;
  // Tracking window comes from the campaign — falls back to 60 days
  // (the platform default) if missing.
  const trackingDays = lead.campaign?.tracking_window_days ?? 60;

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
        aria-labelledby="reserve-title"
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="relative bg-surface rounded-[0.75em] shadow-xl w-full max-w-[28em] p-[1.75em] flex flex-col gap-[1.25em]"
      >
        {/* Headline — shield + 'Held in escrow, not spent' */}
        <div className="flex items-start gap-[0.75em]">
          <span className="shrink-0 inline-flex items-center justify-center w-[2.5em] h-[2.5em] rounded-full bg-accent-light text-accent">
            <ShieldCheck className="w-[1.25em] h-[1.25em]" strokeWidth={1.75} />
          </span>
          <div className="flex flex-col gap-[0.125em] min-w-0 flex-1 pt-[0.125em]">
            <h2
              id="reserve-title"
              className="font-heading text-[1.125em] font-bold tracking-[-0.01em] text-text leading-tight"
            >
              {t("headline")}
            </h2>
            <p className="text-[0.8125em] text-text-secondary font-body leading-snug">
              {t("subheadline", { name: lead.client_full_name ?? t("thisLead") })}
            </p>
          </div>
        </div>

        {/* Hero amount — IBM Plex Mono, large */}
        <div className="flex flex-col gap-[0.125em] items-center text-center py-[0.5em]">
          <span className="text-[0.6875em] font-semibold tracking-[0.08em] uppercase text-text-muted">
            {t("amountLabel")}
          </span>
          <span className="font-mono text-[2em] font-semibold tracking-[-0.02em] text-text leading-[1.05]">
            {formatDZD(reservation)}
          </span>
        </div>

        {/* Breakdown — Commission / Platform fee */}
        <div className="flex flex-col gap-[0.5em] p-[0.875em] rounded-[0.625em] bg-bg-alt">
          <BreakdownRow label={t("commission")} value={formatDZD(commission)} />
          <BreakdownRow label={t("platformFee")} value={formatDZD(platformFee)} />
          <span className="h-px bg-border-light my-[0.125em]" />
          <BreakdownRow label={t("total")} value={formatDZD(reservation)} bold />
        </div>

        {/* Wallet impact — Available before / after */}
        <div className="flex flex-col gap-[0.5em] p-[0.875em] rounded-[0.625em] border border-border-light">
          <BreakdownRow
            label={t("availableBefore")}
            value={formatDZD(available ?? 0)}
            muted
          />
          <BreakdownRow
            label={t("availableAfter")}
            value={formatDZD(after)}
            bold
            tone={insufficient ? "danger" : "default"}
          />
        </div>

        {/* Refund strip — THE trust spine. Always visible. */}
        <div
          className={cn(
            "flex items-start gap-[0.625em] p-[0.875em] rounded-[0.625em]",
            "bg-status-approved-bg border border-status-approved-text/15",
          )}
        >
          <RotateCcw
            className="w-[1em] h-[1em] text-status-approved-text shrink-0 mt-[0.125em]"
            strokeWidth={1.75}
          />
          <p className="text-[0.8125em] text-status-approved-text font-body leading-[1.5]">
            {t("refundStrip", { days: trackingDays })}
          </p>
        </div>

        {/* Insufficient-funds helper — only when applicable */}
        {insufficient && (
          <div className="flex items-start gap-[0.625em] p-[0.75em] rounded-[0.5em] bg-status-rejected-bg">
            <Lock className="w-[1em] h-[1em] text-status-rejected-text shrink-0 mt-[0.125em]" strokeWidth={1.75} />
            <p className="text-[0.8125em] text-status-rejected-text font-body leading-[1.5]">
              {t("insufficientHelper")}
            </p>
          </div>
        )}

        {/* T&Cs inline link — above the CTAs */}
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

        {/* Footer CTAs */}
        <div className="flex items-center justify-end gap-[0.5em]">
          <AppButton variant="ghost" size="md" onClick={handleCancel} disabled={isPending}>
            {t("cancel")}
          </AppButton>
          {insufficient ? (
            <Link
              href="/escrow/fund"
              className="inline-flex items-center h-[2.5em] px-[1.125em] rounded-[0.5em] bg-cta text-cta-text text-[0.875em] font-semibold shadow-xs hover:bg-cta-hover hover:-translate-y-[1px] transition-[background-color,box-shadow,transform] duration-150 ease-out"
            >
              {t("topUp")}
            </Link>
          ) : (
            <AppButton
              variant="primary"
              size="md"
              onClick={onConfirm}
              isLoading={isPending}
              disabled={isPending}
            >
              <span className="inline-flex items-center gap-[0.375em]">
                <ShieldCheck className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
                {t("confirm")}
              </span>
            </AppButton>
          )}
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

function BreakdownRow({ label, value, bold, muted, tone }) {
  return (
    <div className="flex items-baseline justify-between gap-[1em]">
      <span
        className={cn(
          "text-[0.8125em] font-body",
          muted ? "text-text-muted" : "text-text-secondary",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-mono tabular-nums text-[0.875em]",
          bold ? "font-semibold" : "font-medium",
          tone === "danger" ? "text-status-rejected-text" : "text-text",
        )}
      >
        {value}
      </span>
    </div>
  );
}
