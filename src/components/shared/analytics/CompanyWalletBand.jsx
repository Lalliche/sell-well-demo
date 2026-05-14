"use client";

/**
 * CompanyWalletBand — shared bordered wallet card with synced Framer
 * Motion animations. Vault Meter pattern (Stripe Treasury + Brex hybrid).
 * Used by /leads (paired with an activity feed in a 2-col grid) and
 * /escrow (standalone, full-width, transactions table below).
 *
 * Anatomy (top → bottom inside the bordered card):
 *   1. Eyebrow + health pill + Fund/Withdraw CTAs.
 *   2. Hero "Available" balance (animated counter). Optional ghost
 *      `-{debitAmount}` floats next to Available for ~0.9s after a
 *      successful reserve.
 *   3. Secondary stats inline: Reserved · Total deposited.
 *   4. 4px partition bar (Available / Reserved). Slides in lockstep.
 *   5. Bar legend.
 *
 * Helpers (timing, health state, animated counter) live in sibling
 * files so this component stays focused on layout. Distinct from
 * `EscrowWalletCard` (portrait card variant for stat-grid layouts).
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import AppButton from "@/components/ui/Buttons";
import { format as formatDZD } from "@/lib/format/currency";
import { cn } from "@/lib/utils";
import AnimatedDzdNumber from "./AnimatedDzdNumber";
import { ANIM_DURATION, ANIM_EASE, HEALTH, getHealthState } from "./wallet-band-helpers";

export default function CompanyWalletBand({
  wallet,
  isLoading,
  debitAmount = null,
  onDebitAnimationDone,
  /** Localization namespace. Default matches /leads; /escrow passes
   *  "Escrow.wallet" so its copy can diverge. */
  tNamespace = "Leads.companyInbox.wallet",
  className,
}) {
  const t = useTranslations(tNamespace);
  const router = useRouter();

  const available = wallet?.available_balance ?? 0;
  const reserved = wallet?.total_reserved ?? 0;
  const deposited = wallet?.total_deposited ?? 0;
  const state = getHealthState(available, deposited);
  const health = HEALTH[state];

  // Partition pct = Available / (Available + Reserved). Focuses the
  // visual on live commitments rather than total deposited.
  const denom = available + reserved;
  const availPct = denom > 0 ? Math.round((available / denom) * 100) : 0;

  const showGhost = typeof debitAmount === "number" && debitAmount > 0;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!showGhost) return;
    const id = setTimeout(() => onDebitAnimationDone?.(), ANIM_DURATION * 1000 + 250);
    return () => clearTimeout(id);
  }, [showGhost, onDebitAnimationDone]);

  if (isLoading && !wallet) return <SkeletonBand className={className} />;

  return (
    <motion.section
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 4 }}
      transition={{ duration: 0.35, ease: ANIM_EASE }}
      className={cn(
        "flex flex-col justify-center gap-[1em] min-w-0 p-[1.25em]",
        "bg-surface border border-border-light rounded-[0.75em]",
        className,
      )}
      aria-label={t("ariaLabel")}
    >
      {/* Top row — eyebrow + health pill + CTAs */}
      <div className="flex items-center justify-between gap-[1em] flex-wrap">
        <div className="flex items-center gap-[0.625em] min-w-0">
          <span className="text-[0.6875em] font-semibold tracking-[0.08em] uppercase text-text-muted">
            {t("eyebrow")}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-[0.375em] h-[1.625em] px-[0.625em] rounded-full",
              "text-[0.6875em] font-semibold font-body",
              health.pillBg,
              health.textCls,
            )}
            title={t(`health.${state}`)}
          >
            <span className={cn("w-[0.375em] h-[0.375em] rounded-full", health.dotBg)} />
            {t(`health.${state}`)}
          </span>
        </div>

        <div className="flex items-center gap-[0.5em]">
          <AppButton size="sm" variant="primary" onClick={() => router.push("/escrow/fund")}>
            {t("fund")}
          </AppButton>
          <AppButton size="sm" variant="secondary" onClick={() => router.push("/escrow/withdraw")}>
            {t("withdraw")}
          </AppButton>
        </div>
      </div>

      {/* Hero balance + secondary stats inline */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-[1em]">
        <div className="flex flex-col gap-[0.125em] min-w-0">
          <span className="text-[0.6875em] font-semibold tracking-[0.08em] uppercase text-text-muted">
            {t("available")}
          </span>
          <div className="relative inline-flex items-baseline gap-[0.5em]">
            <AnimatedDzdNumber
              value={available}
              className="font-mono text-[2.25em] font-semibold tracking-[-0.02em] text-text leading-[1.05]"
            />
            <AnimatePresence>
              {showGhost && (
                <motion.span
                  key={`debit-${debitAmount}`}
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: -4 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: ANIM_DURATION, ease: ANIM_EASE }}
                  className="font-mono text-[1em] font-semibold text-status-rejected-text tabular-nums leading-none"
                  aria-hidden="true"
                >
                  − {formatDZD(debitAmount, { withSymbol: false })}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-[2em] sm:gap-[2.5em] shrink-0">
          <Stat label={t("reserved")} value={reserved} />
          <Stat label={t("deposited")} value={deposited} muted />
        </div>
      </div>

      {/* 4px partition bar — locks in step with the counters above. */}
      <div className="relative h-[0.25em] w-full bg-bg-alt rounded-full overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${availPct}%` }}
          transition={{ duration: ANIM_DURATION, ease: ANIM_EASE }}
        />
        <motion.div
          className="absolute top-0 h-full bg-text-muted/40"
          initial={{ width: 0, left: "0%" }}
          animate={{ width: `${100 - availPct}%`, left: `${availPct}%` }}
          transition={{ duration: ANIM_DURATION, ease: ANIM_EASE }}
        />
      </div>

      {/* Bar legend — micro-text */}
      <div className="flex items-center gap-[1em] text-[0.6875em] text-text-muted mt-[-0.5em]">
        <span className="inline-flex items-center gap-[0.375em]">
          <span className="w-[0.375em] h-[0.375em] rounded-full bg-accent" />
          {t("legend.available", { pct: availPct })}
        </span>
        <span className="inline-flex items-center gap-[0.375em]">
          <span className="w-[0.375em] h-[0.375em] rounded-full bg-text-muted/40" />
          {t("legend.reserved", { pct: 100 - availPct })}
        </span>
      </div>
    </motion.section>
  );
}

function Stat({ label, value, muted }) {
  return (
    <div className="flex flex-col gap-[0.125em] min-w-0">
      <span className="text-[0.6875em] font-semibold tracking-[0.08em] uppercase text-text-muted">
        {label}
      </span>
      <AnimatedDzdNumber
        value={value}
        className={cn(
          "font-mono text-[1em] font-semibold tabular-nums leading-[1.2]",
          muted ? "text-text-secondary" : "text-text",
        )}
      />
    </div>
  );
}

function SkeletonBand({ className }) {
  return (
    <section className={cn("flex flex-col gap-[1em] p-[1.25em] bg-surface border border-border-light rounded-[0.75em]", className)}>
      <span className="block h-[0.75em] w-[12em] bg-bg-alt rounded-[0.25em] animate-[skeleton-pulse_1.4s_ease-in-out_infinite]" />
      <div className="flex items-end justify-between gap-[1em]">
        <span className="block h-[2em] w-[10em] bg-bg-alt rounded-[0.25em] animate-[skeleton-pulse_1.4s_ease-in-out_infinite]" />
        <span className="block h-[1em] w-[14em] bg-bg-alt rounded-[0.25em] animate-[skeleton-pulse_1.4s_ease-in-out_infinite]" />
      </div>
      <span className="block h-[0.25em] w-full bg-bg-alt rounded-full" />
    </section>
  );
}
