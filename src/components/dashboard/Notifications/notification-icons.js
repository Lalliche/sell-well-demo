/**
 * Per-type icon + tone mapping for notification rows.
 *
 * Driven by `Notification.related_object_type` (see types/notification.ts).
 * Falls back to a generic Bell icon when the type is null or unrecognised
 * (e.g. system-level notifications without a related object).
 *
 * Tone classes use design-system tokens directly so dark mode is a future
 * non-issue. No raw hex / palette colors.
 */

import {
  Inbox,
  FileSignature,
  Store,
  Wallet,
  Link2,
  Bell,
} from "lucide-react";

const FALLBACK = { Icon: Bell, tone: "muted" };

const BY_TYPE = {
  lead:         { Icon: Inbox,         tone: "accent" },
  application:  { Icon: FileSignature, tone: "accent" },
  campaign:     { Icon: Store,         tone: "accent" },
  wallet:       { Icon: Wallet,        tone: "success" },
  partner_link: { Icon: Link2,         tone: "accent" },
};

const TONE_CLS = {
  accent:  "text-accent-text",
  success: "text-[var(--color-trend-positive)]",
  muted:   "text-text-muted",
};

export function getNotificationIcon(relatedObjectType) {
  return BY_TYPE[relatedObjectType] ?? FALLBACK;
}

export function getToneClass(tone) {
  return TONE_CLS[tone] ?? TONE_CLS.muted;
}
