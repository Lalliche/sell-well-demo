/**
 * Pure helpers for /escrow/withdraw — kept out of the page file so the
 * React component stays focused on render.
 *
 * The withdraw page leans on a tri-state ledger (Total / Pending / Available)
 * so the user sees exactly what they can withdraw and what's already
 * frozen — never a single-number balance like the fund page. Pattern from
 * Upwork / Coinbase / Steam: separate Total from Available so pending
 * holds are visible.
 */

import { snapTo500 } from "@/components/shared/forms/AmountChips";

/** Page-level amount validation. Returns { valid, error } where error
 *  is a translated string. `t` is the page's `Escrow.withdraw` t fn.
 *  Mirrors the fund-page rules + adds the available-balance ceiling. */
export function validateWithdrawAmount({ amount, available, min, formatDZD, t }) {
  if (typeof amount !== "number") return { valid: false, error: null };
  if (amount < min) {
    return { valid: false, error: t("error.belowMin", { min: formatDZD(min) }) };
  }
  if (amount % 500 !== 0) {
    return {
      valid: false,
      error: t("error.not500", { snapped: formatDZD(snapTo500(amount)) }),
    };
  }
  if (amount > available) {
    return {
      valid: false,
      error: t("error.exceedsAvailable", { available: formatDZD(available) }),
    };
  }
  return { valid: true, error: null };
}

/** Estimated arrival window: today + 2 business days → today + 5 business
 *  days. Returns { from, to } as locale-formatted strings (or `null` if
 *  Intl can't run, e.g. SSR with no locale). The "date range" rendering
 *  pattern is from Wise / Stripe — concrete dates outperform "2-5 days"
 *  on every published trust test. */
export function estimatedArrivalRange(locale) {
  const now = new Date();
  const from = addBusinessDays(now, 2);
  const to = addBusinessDays(now, 5);
  const fmt = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return { from: fmt.format(from), to: fmt.format(to) };
}

/** Skip Friday + Saturday (Algerian banking weekend). Sun-Thu = business. */
function addBusinessDays(date, n) {
  const d = new Date(date);
  let added = 0;
  while (added < n) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
    if (day !== 5 && day !== 6) added += 1;
  }
  return d;
}

/** Five-stage timeline displayed after submit. Each entry maps to an
 *  i18n key under `Escrow.withdraw.timeline.*`. The "submitted" stage is
 *  always done; the rest depend on the request's status. */
export const TIMELINE_STAGES = [
  "submitted",
  "review",
  "approved",
  "processing",
  "received",
];

/** Returns a stage's `state` ∈ ('done' | 'active' | 'upcoming') given the
 *  current request status. V1 only ships `pending`-on-submit, but the
 *  resolver is forward-compatible for when admin can move the row. */
export function timelineStageState(stage, status) {
  const order = TIMELINE_STAGES;
  const idx = order.indexOf(stage);
  let activeIdx;
  switch (status) {
    case "pending":     activeIdx = 1; break;
    case "processing":  activeIdx = 3; break;
    case "completed":   activeIdx = 4; break;
    case "rejected":    activeIdx = 1; break;
    default:            activeIdx = 0;
  }
  if (idx < activeIdx) return "done";
  if (idx === activeIdx) return "active";
  return "upcoming";
}
