"use client";

/**
 * Application-status pill. One pill, two states:
 *   pending_review        — neutral pending tone, no action.
 *   more_info_requested   — same tone, popover surfaces the admin's note
 *                           when present.
 *
 * The previous inline "Show reason" toggle is gone — admin notes now
 * always render inside the popover when status === more_info_requested
 * AND notes is truthy. Click the pill, see the note. Simpler.
 */

import { useTranslations } from "next-intl";
import { AlertCircle, Clock } from "lucide-react";
import BannerPill from "./BannerPill";

const STATUS_TONE = {
  pending_review: {
    Icon: Clock,
    iconBg: "bg-[var(--color-status-pending-bg)]",
    iconColor: "text-[var(--color-status-pending-text)]",
  },
  more_info_requested: {
    Icon: AlertCircle,
    iconBg: "bg-[var(--color-status-pending-bg)]",
    iconColor: "text-[var(--color-status-pending-text)]",
  },
};

export default function ApplicationBanner({ status, notes }) {
  const t = useTranslations("Auth.Banners.application");
  const tone = STATUS_TONE[status];
  if (!tone) return null;

  const { Icon, iconBg, iconColor } = tone;
  const showNotes = !!notes && status === "more_info_requested";

  return (
    <BannerPill
      icon={<Icon size="0.875em" strokeWidth={1.75} />}
      iconBg={iconBg}
      iconColor={iconColor}
      pillTitle={t(`${status}.pillTitle`)}
      title={t(`${status}.title`)}
      body={t(`${status}.body`)}
      ariaLabel={t(`${status}.title`)}
      notes={showNotes ? notes : null}
    />
  );
}
