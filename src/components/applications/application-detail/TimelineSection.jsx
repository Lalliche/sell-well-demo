"use client";

/**
 * TimelineSection — renders the application's status timeline + the
 * rejection callout on rejected rows.
 */

import TimelineStep from "@/components/shared/data-display/timeline/TimelineStep";
import { buildApplicationTimelineSteps } from "./build-timeline-steps";
import RejectionCallout from "./RejectionCallout";

export default function TimelineSection({ application, locale, cooldownDays, canReapply, t }) {
  const steps = buildApplicationTimelineSteps({ application, locale, t });
  return (
    <ol className="flex flex-col gap-0">
      {steps.map((step, i) => (
        <TimelineStep key={step.key} step={step} isLast={i === steps.length - 1} />
      ))}
      {application.status === "rejected" && (
        <RejectionCallout cooldownDays={cooldownDays} canReapply={canReapply} t={t} />
      )}
    </ol>
  );
}
