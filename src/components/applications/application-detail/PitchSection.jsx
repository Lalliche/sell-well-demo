"use client";

/**
 * PitchSection — full pitch text in a quoted block with a steel-blue
 * left rule (the agent's premium signal). Header chips show the current
 * status and the pitch's character count.
 */

import StatusBadge from "@/components/shared/data-display/StatusBadge";

export default function PitchSection({ application }) {
  return (
    <div className="flex flex-col gap-[1em]">
      <div className="flex items-center gap-[0.5em] text-[0.75em] text-text-muted font-body">
        <StatusBadge status={application.status} />
        <span className="font-mono tabular-nums">
          {application.pitch.length} chars
        </span>
      </div>
      <blockquote className="border-l-2 border-accent pl-[1em] py-[0.25em] flex flex-col gap-[0.5em]">
        <p className="text-[0.9375em] text-text font-body leading-[1.65] whitespace-pre-line">
          {application.pitch}
        </p>
      </blockquote>
    </div>
  );
}
