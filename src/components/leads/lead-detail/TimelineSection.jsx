"use client";

/**
 * TimelineSection — orchestrates the per-status timeline + the optional
 * denial-reason callout for the LeadDetailOverlay.
 *
 * The step machine itself lives in `build-timeline-steps.js` so this
 * file stays focused on rendering.
 */

import TimelineStep from "@/components/shared/data-display/timeline/TimelineStep";
import { buildTimelineSteps } from "./build-timeline-steps";

export default function TimelineSection({ lead, locale, isExpiringSoon, daysRemaining, t }) {
  const steps = buildTimelineSteps({ lead, locale, isExpiringSoon, daysRemaining, t });
  const showDenial =
    (lead.status === "not_converted" ||
      lead.status === "disputed_verifying" ||
      lead.status === "expired_verifying") &&
    typeof lead.denial_reason === "string";

  return (
    <ol className="flex flex-col gap-0">
      {steps.map((step, i) => (
        <TimelineStep key={step.key} step={step} isLast={i === steps.length - 1} />
      ))}
      {showDenial && (
        <li className="mt-[1em] rounded-[0.5em] border border-border-light bg-surface px-[1em] py-[0.875em] flex flex-col gap-[0.5em]">
          <p className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted">
            {t("denial.label")}
          </p>
          <p className="text-[0.8125em] text-text-secondary leading-[1.55]">
            {lead.denial_reason || t("denial.fallback")}
          </p>
        </li>
      )}
    </ol>
  );
}
