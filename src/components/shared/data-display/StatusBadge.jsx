/**
 * StatusBadge — Displays a status as a subtle tinted badge.
 *
 * Props:
 *   status    string — one of the known statuses below, or any custom string
 *   label     string — override display label (defaults to prettified status)
 *   className string — extra classes
 *
 * Supported statuses (from data-model-spec.md):
 *   Lead:        submitted · pending_escrow · acknowledged · converted · converted_verified
 *                not_converted · disputed_verifying · expired · expired_verifying
 *   Application: pending · approved · rejected
 *   Campaign:    draft · active · paused · closed
 *   Wallet tx:   deposit · reservation · release_commission · release_platform_fee · return · withdrawal
 *
 * States / tones:
 *   success  → green  (approved, active, converted, converted_verified, deposit, return)
 *   warning  → amber  (pending, pending_escrow, submitted, paused, draft, reservation)
 *   danger   → red    (rejected, not_converted, disputed_verifying, expired, expired_verifying)
 *   info     → blue   (acknowledged, release_commission, release_platform_fee, withdrawal)
 *   neutral  → gray   (closed, unknown)
 *
 * Design system (design-system-final.md §Status Badges):
 *   No border. Background tint + text color only.
 *   Radius 6px. Padding 5px 14px (md) or 3px 10px (sm). Font 11-12px DM Sans weight 600.
 */

import { cn } from "@/lib/utils";

const TONES = {
  success: { bg: "bg-status-approved-bg", text: "text-status-approved-text" },
  warning: { bg: "bg-status-pending-bg",  text: "text-status-pending-text"  },
  danger:  { bg: "bg-status-rejected-bg", text: "text-status-rejected-text" },
  info:    { bg: "bg-status-active-bg",   text: "text-status-active-text"   },
  neutral: { bg: "bg-bg-alt",             text: "text-text-muted"           },
};

const STATUS_TONES = {
  /* Lead */
  submitted:           "warning",
  pending_escrow:      "warning",
  acknowledged:        "info",
  converted:           "success",
  converted_verified:  "success",
  not_converted:       "danger",
  disputed_verifying:  "danger",
  expired:             "danger",
  expired_verifying:   "danger",
  /* Application */
  pending:             "warning",
  approved:            "success",
  rejected:            "danger",
  /* Campaign */
  draft:               "neutral",
  active:              "success",
  paused:              "warning",
  closed:              "neutral",
  /* Wallet */
  deposit:             "success",
  reservation:         "warning",
  release_commission:  "info",
  release_platform_fee:"info",
  return:              "success",
  withdrawal:          "info",
  /* Withdrawal request lifecycle */
  processing:          "info",
  completed:           "success",
};

function prettify(str) {
  return str
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StatusBadge({ status = "", label, className }) {
  const tone = TONES[STATUS_TONES[status] ?? "neutral"];
  const display = label ?? prettify(status);

  return (
    <span
      className={cn(
        "inline-flex items-center px-[0.625em] py-[0.3125em]",
        "rounded-[0.375em] text-[0.75em] font-semibold font-body whitespace-nowrap",
        tone.bg, tone.text,
        className,
      )}
    >
      {display}
    </span>
  );
}
