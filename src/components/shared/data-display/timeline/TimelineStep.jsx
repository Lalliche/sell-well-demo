"use client";

/**
 * TimelineStep — single row in a vertical status timeline.
 *
 * Pure presentation: icon + connector rail + title + timestamp + body,
 * tone-mapped from the step's `state` field. Used by both the
 * /leads and /applications detail overlays — promote new variants here
 * instead of forking, so the visual stays consistent.
 *
 * Step shape:
 *   { title, body, timestamp?, state }
 *     state ∈ "complete" | "current" | "skipped" | "approved" | "rejected" | "warning"
 */

import { CheckCircle2, Circle, XCircle, AlertTriangle } from "lucide-react";

const ICON_BY_STATE = {
  approved: CheckCircle2,
  rejected: XCircle,
  warning: AlertTriangle,
  current: Circle,
  skipped: Circle,
  complete: CheckCircle2,
};

const TONE_BY_STATE = {
  approved: "text-trend-positive",
  rejected: "text-trend-negative",
  warning: "text-status-pending-text",
  current: "text-accent",
  skipped: "text-text-muted",
  complete: "text-text-secondary",
};

function railTone(state) {
  return state === "complete" || state === "approved" || state === "rejected"
    ? "bg-border"
    : "bg-border-light";
}

export default function TimelineStep({ step, isLast }) {
  const Icon = ICON_BY_STATE[step.state] ?? CheckCircle2;
  const tone = TONE_BY_STATE[step.state] ?? "text-text-secondary";

  return (
    <li className="flex gap-[0.875em]">
      <div className="flex flex-col items-center shrink-0 pt-[0.125em]">
        <Icon className={`w-[1.125em] h-[1.125em] ${tone}`} strokeWidth={1.75} />
        {!isLast && <span className={`flex-1 w-px my-[0.25em] ${railTone(step.state)}`} />}
      </div>
      <div className="flex flex-col gap-[0.25em] pb-[1em] flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-[0.75em] flex-wrap">
          <span className="text-[0.875em] font-semibold text-text">{step.title}</span>
          {step.timestamp && (
            <span className="text-[0.75em] font-mono tabular-nums text-text-muted">
              {step.timestamp}
            </span>
          )}
        </div>
        <p className="text-[0.8125em] text-text-secondary leading-[1.55]">{step.body}</p>
      </div>
    </li>
  );
}
