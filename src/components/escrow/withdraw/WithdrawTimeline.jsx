"use client";

/**
 * WithdrawTimeline — vertical 5-stage timeline that replaces the
 * form once the user submits. Patterns from Airwallex (full-pipeline
 * vertical) + Wise (3-stage horizontal narrative) — we go vertical
 * because Algerian payouts have 5 distinct steps and a vertical
 * timeline takes less horizontal real estate inside our card.
 *
 * Stage 0 (submitted) is always done — by the time the user sees this
 * panel, the request has been written. Stage 1 (review) is where V1
 * sits until admin moves the row. Cancellation is allowed only while
 * the active stage is `review` — once admin approves, the disbursement
 * is in motion.
 *
 * Active stage gets a steel-blue accent + pulsing dot. Done stages
 * are filled with the trend-positive green; upcoming stages are
 * ghosted text-muted.
 */

import { motion } from "motion/react";
import { Check, Clock } from "lucide-react";
import AppButton from "@/components/ui/Buttons";
import { format as formatDZD } from "@/lib/format/currency";
import { cn } from "@/lib/utils";
import { TIMELINE_STAGES, timelineStageState } from "./withdraw-helpers";

export default function WithdrawTimeline({
  withdrawal,
  arrivalRange,
  destinationLabel,
  onCancel,
  onDone,
  isCancelling,
  t,
  className,
}) {
  const status = withdrawal?.status ?? "pending";
  const canCancel = status === "pending";

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "flex flex-col gap-[1.25em] p-[1.5em] bg-surface border border-border rounded-[0.75em] shadow-sm",
        className,
      )}
    >
      <header className="flex flex-col gap-[0.25em]">
        <span className="text-[0.6875em] font-semibold tracking-[0.08em] uppercase text-text-muted">
          {t("timeline.eyebrow")}
        </span>
        <h2 className="font-heading text-[1.25em] font-semibold tracking-[-0.01em] text-text">
          {t("timeline.title", { amount: formatDZD(withdrawal?.amount ?? 0) })}
        </h2>
        <p className="text-[0.8125em] text-text-secondary font-body leading-[1.5] max-w-[36em]">
          {t("timeline.body", {
            destination: destinationLabel ?? "—",
            from: arrivalRange?.from ?? "—",
            to: arrivalRange?.to ?? "—",
          })}
        </p>
      </header>

      {/* Vertical stage list */}
      <ol className="flex flex-col">
        {TIMELINE_STAGES.map((stage, i) => {
          const state = timelineStageState(stage, status);
          const isLast = i === TIMELINE_STAGES.length - 1;
          return (
            <Stage
              key={stage}
              label={t(`timeline.stages.${stage}.label`)}
              body={t(`timeline.stages.${stage}.body`)}
              state={state}
              isLast={isLast}
            />
          );
        })}
      </ol>

      {/* Footer actions */}
      <footer className="flex items-center justify-between gap-[0.875em] pt-[0.875em] border-t border-border-light flex-wrap">
        <p className="text-[0.75em] text-text-muted font-body leading-[1.5] max-w-[28em]">
          {canCancel ? t("timeline.cancelHint") : t("timeline.cancelLocked")}
        </p>
        <div className="flex items-center gap-[0.5em]">
          {canCancel && onCancel && (
            <AppButton
              variant="ghost"
              size="sm"
              onClick={onCancel}
              isLoading={isCancelling}
              disabled={isCancelling}
            >
              {t("timeline.cancelCta")}
            </AppButton>
          )}
          {onDone && (
            <AppButton variant="secondary" size="sm" onClick={onDone}>
              {t("timeline.doneCta")}
            </AppButton>
          )}
        </div>
      </footer>
    </motion.section>
  );
}

function Stage({ label, body, state, isLast }) {
  const dot =
    state === "done"
      ? "bg-trend-positive border-trend-positive text-white"
      : state === "active"
        ? "bg-accent border-accent text-white"
        : "bg-surface border-border-light text-text-muted";
  const railTone =
    state === "done" ? "bg-trend-positive" : "bg-border-light";
  return (
    <li className="flex gap-[0.875em] min-h-[3.5em] last:min-h-[2.25em]">
      <div className="flex flex-col items-center shrink-0">
        <span
          className={cn(
            "relative flex items-center justify-center w-[1.5em] h-[1.5em] rounded-full border-[1.5px] shrink-0",
            dot,
          )}
        >
          {state === "done" ? (
            <Check className="w-[0.75em] h-[0.75em]" strokeWidth={3} />
          ) : state === "active" ? (
            <span className="block w-[0.5em] h-[0.5em] rounded-full bg-white" />
          ) : (
            <Clock className="w-[0.625em] h-[0.625em]" strokeWidth={1.75} />
          )}
          {state === "active" && (
            <span className="absolute inset-0 rounded-full border-2 border-accent animate-ping opacity-50" />
          )}
        </span>
        {!isLast && (
          <span className={cn("flex-1 w-[1.5px] my-[0.25em] min-h-[1.25em]", railTone)} />
        )}
      </div>
      <div className="flex flex-col gap-[0.125em] pb-[1em] last:pb-0">
        <span
          className={cn(
            "text-[0.875em] font-semibold font-body leading-[1.3]",
            state === "upcoming" ? "text-text-muted" : "text-text",
          )}
        >
          {label}
        </span>
        <span className="text-[0.75em] text-text-secondary font-body leading-[1.5]">
          {body}
        </span>
      </div>
    </li>
  );
}
