"use client";

/**
 * FooterStateChip — contextual chip rendered in the LeadDetailOverlay
 * footer alongside the "Open campaign" link. Three variants:
 *   - acknowledged    → tracking-window countdown (warning tone <48h)
 *   - converted/_verified → green confirmed pill
 *   - disputed/expired_verifying → muted "Verifying" chip
 *
 * Returns null for any other status — the footer just shows the link.
 */

import { CheckCircle2, AlertTriangle, Clock, FileEdit } from "lucide-react";

export default function FooterStateChip({ lead, isExpiringSoon, daysRemaining, t }) {
  if (lead.status === "draft") {
    return (
      <Chip tone="bg-bg-alt text-text-secondary" icon={FileEdit}>
        {t("draftChip")}
      </Chip>
    );
  }
  if (lead.status === "acknowledged" && typeof daysRemaining === "number") {
    const tone = isExpiringSoon
      ? "bg-status-pending-bg text-status-pending-text"
      : "bg-status-active-bg text-status-active-text";
    return (
      <Chip tone={tone} mono icon={Clock}>
        {t("trackingDaysLeft", { days: daysRemaining })}
      </Chip>
    );
  }
  if (lead.status === "converted" || lead.status === "converted_verified") {
    return (
      <Chip tone="bg-status-approved-bg text-status-approved-text" icon={CheckCircle2}>
        {t("commission.confirmedShort")}
      </Chip>
    );
  }
  if (lead.status === "disputed_verifying" || lead.status === "expired_verifying") {
    return (
      <Chip tone="bg-bg-alt text-text-secondary" icon={AlertTriangle}>
        {t("verifyingShort")}
      </Chip>
    );
  }
  return null;
}

function Chip({ tone, mono, icon: Icon, children }) {
  return (
    <span
      className={`inline-flex items-center gap-[0.375em] h-[2em] px-[0.75em] rounded-full text-[0.75em] font-semibold whitespace-nowrap ${
        mono ? "font-mono tabular-nums" : ""
      } ${tone}`}
    >
      <Icon className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
      {children}
    </span>
  );
}
