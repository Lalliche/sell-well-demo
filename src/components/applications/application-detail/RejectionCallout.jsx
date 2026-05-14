"use client";

/**
 * RejectionCallout — appears under the timeline on rejected applications.
 * Header chip flips between "Re-apply available" (green) once cooldown
 * elapses and "Re-apply in N days" (mono, muted) while waiting.
 */

import { Clock } from "lucide-react";

export default function RejectionCallout({ cooldownDays, canReapply, t }) {
  return (
    <li className="mt-[1em] rounded-[0.5em] border border-border-light bg-surface px-[1em] py-[0.875em] flex flex-col gap-[0.625em]">
      <div className="flex items-start justify-between gap-[0.75em]">
        <p className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted">
          {t("rejection.label")}
        </p>
        {typeof cooldownDays === "number" &&
          (canReapply ? (
            <span className="inline-flex items-center gap-[0.3em] h-[1.5em] px-[0.5em] rounded-full text-[0.6875em] font-semibold font-body bg-status-approved-bg text-status-approved-text whitespace-nowrap">
              {t("actions.reapplyAvailable")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-[0.3em] h-[1.5em] px-[0.5em] rounded-full text-[0.6875em] font-semibold font-mono tabular-nums bg-bg-alt text-text-secondary whitespace-nowrap">
              <Clock className="w-[0.75em] h-[0.75em]" strokeWidth={1.75} />
              {t("actions.reapplyCooldown", { days: cooldownDays })}
            </span>
          ))}
      </div>
      <p className="text-[0.8125em] text-text-secondary leading-[1.55]">
        {t("rejection.fallback")}
      </p>
    </li>
  );
}
