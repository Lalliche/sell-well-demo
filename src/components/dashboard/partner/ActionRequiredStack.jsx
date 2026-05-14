"use client";

/**
 * Action required — right rail next to the hero chart.
 *
 * Renders a vertical list of items synthesized by `fetchPartnerActions`.
 * Each item: severity-toned icon-circle + title + body + optional
 * deadline chip + click target → href.
 *
 * Severity tones map to the design system status colors:
 *   "warn"   → pending tone (amber-cream)
 *   "info"   → accent tone
 *   "danger" → rejected tone (rose-cream)
 *
 * Empty state when no actions: friendly check-mark + "You're on top of it."
 */

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  AlertCircle, CheckCircle2, Clock, FileSignature,
  Wallet, ArrowRight, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SEVERITY_TONE = {
  warn: {
    iconBg: "bg-[var(--color-status-pending-bg)]",
    iconText: "text-[var(--color-status-pending-text)]",
    deadlineBg: "bg-[var(--color-status-pending-bg)]",
    deadlineText: "text-[var(--color-status-pending-text)]",
  },
  info: {
    iconBg: "bg-accent-light",
    iconText: "text-accent-text",
    deadlineBg: "bg-accent-light",
    deadlineText: "text-accent-text",
  },
  danger: {
    iconBg: "bg-[var(--color-status-rejected-bg)]",
    iconText: "text-[var(--color-status-rejected-text)]",
    deadlineBg: "bg-[var(--color-status-rejected-bg)]",
    deadlineText: "text-[var(--color-status-rejected-text)]",
  },
};

const TYPE_ICON = {
  lead_expiring: Clock,
  application_approved: FileSignature,
  banking_missing: Wallet,
};

function formatDeadline(iso, t) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return t("expired");
  const hours = Math.round(ms / 3_600_000);
  if (hours < 24) return t("inHours", { count: hours });
  const days = Math.round(hours / 24);
  return t("inDays", { count: days });
}

export default function ActionRequiredStack({ actions, isLoading }) {
  const t = useTranslations("Dashboard.PartnerDashboard.actions");
  const tDeadline = useTranslations("Dashboard.PartnerDashboard.actions.deadline");

  return (
    <div className="bg-surface border border-border-light rounded-[0.75em] shadow-xs p-[1.25em] flex flex-col gap-[0.875em] h-full">
      <div className="flex items-center justify-between gap-[0.5em]">
        <span className="text-[0.6875em] uppercase tracking-[0.08em] text-text-muted font-semibold">
          {t("title")}
        </span>
        {!isLoading && actions?.length > 0 && (
          <span className="font-mono text-[0.6875em] text-text-muted">
            {actions.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <ActionsSkeleton />
      ) : actions && actions.length > 0 ? (
        <div className="flex flex-col gap-[0.5em]">
          {actions.map((a) => (
            <ActionRow
              key={a.id}
              action={a}
              deadlineLabel={formatDeadline(a.deadlineISO, tDeadline)}
            />
          ))}
        </div>
      ) : (
        <Empty />
      )}
    </div>
  );
}

function ActionRow({ action, deadlineLabel }) {
  const tone = SEVERITY_TONE[action.severity] ?? SEVERITY_TONE.info;
  const Icon = TYPE_ICON[action.type] ?? AlertCircle;
  const Wrapper = action.href ? Link : "div";
  const wrapperProps = action.href
    ? { href: action.href }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "group flex items-start gap-[0.625em] p-[0.75em] rounded-[0.5em]",
        "border border-border-light bg-surface",
        action.href && "hover:bg-bg-alt cursor-pointer transition-[background-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "shrink-0 inline-flex items-center justify-center w-[1.75em] h-[1.75em] rounded-full",
          tone.iconBg,
          tone.iconText,
        )}
      >
        <Icon size="0.875em" strokeWidth={1.75} />
      </span>

      <div className="flex-1 min-w-0 flex flex-col gap-[0.25em]">
        <div className="flex items-start justify-between gap-[0.5em]">
          <span className="text-[0.8125em] font-semibold text-text leading-[1.3] line-clamp-2">
            {action.title}
          </span>
          {action.href && (
            <ArrowRight
              size="0.875em"
              strokeWidth={2}
              className="shrink-0 text-text-muted mt-[0.125em] transition-transform duration-150 ease-out group-hover:translate-x-[0.125em]"
            />
          )}
        </div>
        <span className="text-[0.75em] text-text-secondary leading-[1.5] line-clamp-2">
          {action.body}
        </span>
        {deadlineLabel && (
          <span
            className={cn(
              "self-start mt-[0.125em] inline-flex items-center px-[0.5em] py-[0.125em] rounded-full",
              "text-[0.6875em] font-semibold font-mono",
              tone.deadlineBg,
              tone.deadlineText,
            )}
          >
            {deadlineLabel}
          </span>
        )}
      </div>
    </Wrapper>
  );
}

function ActionsSkeleton() {
  return (
    <div className="flex flex-col gap-[0.5em]">
      {[0, 1, 2].map((i) => (
        <div key={i} className="border border-border-light rounded-[0.5em] p-[0.75em] flex items-start gap-[0.625em]">
          <span className="shrink-0 w-[1.75em] h-[1.75em] rounded-full bg-bg-alt" />
          <div className="flex-1 flex flex-col gap-[0.375em]">
            <span className="block h-[0.75em] w-[70%] rounded-[0.25em] bg-bg-alt" />
            <span className="block h-[0.625em] w-[90%] rounded-[0.25em] bg-bg-alt" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty() {
  const t = useTranslations("Dashboard.PartnerDashboard.actions.empty");
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-[0.5em] py-[1.5em]">
      <span
        aria-hidden="true"
        className="inline-flex items-center justify-center w-[2.25em] h-[2.25em] rounded-full bg-accent-light text-accent-text"
      >
        <Sparkles size="1em" strokeWidth={1.75} />
      </span>
      <span className="text-[0.875em] font-medium text-text">{t("title")}</span>
      <span className="text-[0.75em] text-text-muted leading-[1.5] max-w-[18em]">
        {t("body")}
      </span>
    </div>
  );
}
