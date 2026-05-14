/**
 * Partner-link-detail formatting helpers. Pure functions, no React.
 *
 * Mirrors the lead-detail-helpers pattern (one small helpers file per
 * feature so the overlay sections stay scoped to layout).
 */

export function fmtDA(n) {
  if (typeof n !== "number") return "—";
  return Number(n).toLocaleString("fr-DZ");
}

export function formatAbsolute(iso, locale) {
  if (!iso) return null;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatShortDate(iso, locale) {
  if (!iso) return null;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/** Format the campaign's commission terms for display. */
export function formatCommissionTerms(campaign, t) {
  if (!campaign) return "—";
  return campaign.commission_type === "percentage"
    ? t("campaign.pctCommission", { value: campaign.commission_value })
    : t("campaign.flatCommission", { value: fmtDA(campaign.commission_value) });
}
