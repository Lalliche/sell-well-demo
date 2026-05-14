"use client";

/**
 * LockedSection — full-section gate for the company-side
 * LeadDetailOverlay. Shown in place of Client / Documents / Notes when
 * `lead.contact_revealed === false` (pre-reservation).
 *
 * Visual: lock icon + headline + body + a primary "Reserve & view" CTA
 * that triggers the same dialog as the inbox row's per-row CTA. Reads
 * as a paywall, not as missing data — the company sees the gate, the
 * gate's reason, and a single click to clear it.
 */

import { Lock } from "lucide-react";
import AppButton from "@/components/ui/Buttons";

export default function LockedSection({ kind, lead, onReserveClick, t }) {
  return (
    <div className="flex flex-col items-center text-center gap-[1em] py-[2em] px-[1.5em] bg-bg-alt rounded-[0.625em]">
      <span
        aria-hidden="true"
        className="inline-flex items-center justify-center w-[3em] h-[3em] rounded-full bg-surface text-text-muted shadow-xs"
      >
        <Lock className="w-[1.25em] h-[1.25em]" strokeWidth={1.5} />
      </span>
      <div className="flex flex-col gap-[0.375em] max-w-[24em]">
        <p className="text-[0.9375em] font-semibold text-text font-body">
          {t(`locked.${kind}.title`)}
        </p>
        <p className="text-[0.8125em] text-text-secondary font-body leading-[1.55]">
          {t(`locked.${kind}.body`)}
        </p>
      </div>
      <AppButton
        variant="primary"
        size="sm"
        onClick={() => onReserveClick?.(lead)}
      >
        {t("locked.reserveCta")}
      </AppButton>
    </div>
  );
}
