/**
 * Pure helpers for /escrow/fund — kept out of the page file so the
 * React component stays focused on render.
 *
 * Per-method config (fee, ETA, limits) is the single source of truth
 * for both the FundMethodTile and the FundReceipt — they read from
 * here so the tile and the receipt cannot disagree.
 *
 * Chargily Pay charges 1.5% on CIB / EDAHABIA card transactions in V1
 * (per the user's direction — if SellWell doesn't pass this through,
 * SellWell eats the cost). Bank transfer is free but manual + 1-2 days.
 */

import { snapTo500 } from "@/components/shared/forms/AmountChips";
import { getPlatformSetting } from "@/lib/mock/admin";

/** Per-method config. `feeRate` is the Chargily processing rate as a
 *  decimal (0.015 = 1.5%). Bank transfer is V1.5 — kept here so the
 *  shape lines up when we wire it. */
export const FUND_METHODS = {
  cib: {
    key: "cib",
    feeRate: 0.015,
    feeKind: "percent",
    eta: "instant",
    minDA: 1000,
    maxDA: 2_000_000,
  },
  edahabia: {
    key: "edahabia",
    feeRate: 0.015,
    feeKind: "percent",
    eta: "instant",
    minDA: 1000,
    maxDA: 200_000,
  },
};

export const FUND_METHOD_KEYS = ["cib", "edahabia"];

/** Compute the fee for an amount + method. Returns 0 when amount is
 *  invalid (lets the receipt render `0.00 DZD` while the user types). */
export function computeFundFee(amount, methodKey) {
  const m = FUND_METHODS[methodKey];
  if (!m) return 0;
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (m.feeKind === "percent") return Math.round(amount * m.feeRate);
  return 0;
}

/** Page-level amount validation. `t` is the page's `Escrow.fund` t fn.
 *  Floor is `max(method.minDA, PlatformSetting.escrow_min_deposit_da)` so
 *  the platform-wide minimum from /admin/settings is always enforced even
 *  if a method's own min is lower. Live read so admin edits take effect
 *  immediately. */
export function validateFundAmount({ amount, method, formatDZD, t }) {
  if (typeof amount !== "number") return { valid: false, error: null };
  const m = FUND_METHODS[method];
  const platformMin = getPlatformSetting("escrow_min_deposit_da", 1000);
  const min = Math.max(m?.minDA ?? 1000, platformMin);
  const max = m?.maxDA ?? Infinity;
  if (amount < min) {
    return { valid: false, error: t("error.belowMin", { min: formatDZD(min) }) };
  }
  if (amount % 500 !== 0) {
    return {
      valid: false,
      error: t("error.not500", { snapped: formatDZD(snapTo500(amount)) }),
    };
  }
  if (amount > max) {
    return { valid: false, error: t("error.exceedsMax", { max: formatDZD(max) }) };
  }
  return { valid: true, error: null };
}

/** Estimated arrival — Chargily card transactions land instantly during
 *  banking hours; the receipt shows a date so the user has a concrete
 *  reference even when the answer is "now." */
export function estimatedArrivalLabel(methodKey, locale) {
  const m = FUND_METHODS[methodKey];
  if (!m) return null;
  if (m.eta === "instant") {
    // Concrete-but-ambiguous: today during banking hours, otherwise next
    // business day. Matches what Chargily actually does in practice.
    return new Intl.DateTimeFormat(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(new Date());
  }
  return null;
}
