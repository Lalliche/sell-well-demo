"use client";

/**
 * PricingTiersBlock — full-width pricing block for the company-side
 * detail page. Renders as a section (title + table-ish list of tiers
 * with computed commission per row), not the slim rail variant the
 * partner detail uses.
 *
 * Two rendering modes (same single-vs-multi convention as the partner
 * side per `campaigns-marketplace-spec.md`):
 *   - Single tier  → "Standard pricing" headline + price + per-sale commission
 *   - Multi tier   → tier-by-tier rows
 *
 * Read-only here — editing happens via the CampaignEditOverlay's Pricing
 * section.
 */

import { useTranslations } from "next-intl";
import { format as formatDZD } from "@/lib/format/currency";

export default function PricingTiersBlock({ campaign }) {
  const t = useTranslations("Campaigns.companyDetail.pricing");
  const tiers = [...(campaign.pricing_tiers ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  if (tiers.length === 0) return null;
  const isSingle = tiers.length === 1;

  const commissionFor = (price) =>
    campaign.commission_type === "percentage"
      ? Math.round(price * (campaign.commission_value / 100))
      : campaign.commission_value;

  return (
    <div className="flex flex-col gap-[0.625em]">
      <div className="flex items-baseline justify-between gap-[1em]">
        <h2 className="font-heading text-[1.125em] font-semibold tracking-[-0.01em] text-text">
          {isSingle ? t("singleTitle") : t("title")}
        </h2>
        <span className="text-[0.6875em] uppercase tracking-[0.06em] font-semibold text-text-muted">
          {t("perSale")}
        </span>
      </div>

      <ul className="flex flex-col bg-surface border border-border-light rounded-[0.625em] overflow-hidden">
        {tiers.map((tier, i) => (
          <li
            key={tier.id}
            className={[
              "flex items-center justify-between gap-[0.875em] px-[1em] py-[0.875em]",
              i > 0 ? "border-t border-border-light" : "",
            ].join(" ")}
          >
            <div className="flex flex-col min-w-0">
              <span className="text-[0.875em] font-semibold text-text truncate">
                {isSingle ? t("standardLabel") : tier.name || t("untitledTier")}
              </span>
              <span className="font-mono text-[0.75em] text-text-muted tabular-nums">
                {formatDZD(tier.price)}
              </span>
            </div>
            <span className="font-mono text-[0.875em] font-semibold text-accent tabular-nums shrink-0">
              +{formatDZD(commissionFor(tier.price), { withSymbol: false })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
