/**
 * wallet-band-helpers — shared timing constants + pure helpers for
 * `CompanyWalletBand`. Extracted so the band component itself stays
 * under the project's ~150–200 line ceiling and so future wallet
 * surfaces (e.g. /escrow/fund, /escrow/withdraw) can reuse the same
 * easing without re-importing `motion/react` just to cite a vector.
 */

/** One source of truth for animation timing. The partition bar +
 *  counters + debit ghost all share these so they finish in lockstep
 *  — that synchronization IS the "money moving" signal. */
export const ANIM_DURATION = 0.9;
export const ANIM_EASE = [0.4, 0, 0.2, 1];

/** Health-state palette per (available / deposited) ratio. The band
 *  consumes this directly; the dashboard's portrait `EscrowWalletCard`
 *  has its own duplicate today (older code) — collapse later. */
export const HEALTH = {
  active:    { dotBg: "bg-trend-positive", textCls: "text-trend-positive",       pillBg: "bg-status-approved-bg" },
  moderate:  { dotBg: "bg-accent",         textCls: "text-accent-text",          pillBg: "bg-status-active-bg"   },
  low:       { dotBg: "bg-[#D97706]",      textCls: "text-[#8B6914]",            pillBg: "bg-status-pending-bg"  },
  "at-risk": { dotBg: "bg-trend-negative", textCls: "text-status-rejected-text", pillBg: "bg-status-rejected-bg" },
};

/** Pure: ratio → state. Caller derives the health pill from this. */
export function getHealthState(available, deposited) {
  if (!deposited || deposited <= 0) return "at-risk";
  if (available <= 0) return "at-risk";
  const ratio = available / deposited;
  if (ratio >= 0.8) return "active";
  if (ratio >= 0.5) return "moderate";
  if (ratio >= 0.1) return "low";
  return "at-risk";
}
