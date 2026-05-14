"use client";

/**
 * PricingTiersList — pricing block inside the ApplyRail.
 *
 * Two rendering modes driven by tier count:
 *   - Single-tier (most campaigns): a single "Standard pricing" row with
 *     the price on the left and the commission on the right. No tier
 *     name is surfaced — the campaign has one fixed sale price, and the
 *     partner doesn't need to mentally bridge "tier" → "price."
 *   - Multi-tier (2+): the original stacked list — each row shows tier
 *     name + price on the left and per-tier commission on the right.
 *
 * Tiers are read-only here — the partner doesn't pick a tier to apply
 * (tier selection happens at lead-submission time, not application time).
 * This list exists so the partner can read the deal's economics before
 * deciding to apply.
 */

import { useTranslations } from "next-intl";
import { format as formatDZD } from "@/lib/format/currency";

export default function PricingTiersList({ campaign }) {
  const t = useTranslations("Marketplace.detail.tiers");
  const tiers = [...(campaign.pricing_tiers ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  if (tiers.length === 0) return null;

  const isSingle = tiers.length === 1;

  if (isSingle) {
    const only = tiers[0];
    const commission =
      campaign.commission_type === "percentage"
        ? Math.round(only.price * (campaign.commission_value / 100))
        : campaign.commission_value;
    return (
      <div className="flex flex-col gap-[0.25em]">
        <span className="text-[0.6875em] font-semibold tracking-[0.08em] uppercase text-text-muted px-[0.25em]">
          {t("singleTitle")}
        </span>
        <div className="flex items-center justify-between gap-[0.75em] px-[0.625em] py-[0.5em] rounded-[0.5em]">
          <span className="font-mono text-[1.125em] font-semibold text-text">
            {formatDZD(only.price)}
          </span>
          <span className="font-mono text-[0.8125em] font-semibold text-accent shrink-0">
            +{formatDZD(commission, { withSymbol: false })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[0.25em]">
      <span className="text-[0.6875em] font-semibold tracking-[0.08em] uppercase text-text-muted px-[0.25em]">
        {t("title")}
      </span>
      <ul className="flex flex-col gap-[0.25em]">
        {tiers.map((tier) => {
          const commissionForTier =
            campaign.commission_type === "percentage"
              ? Math.round(tier.price * (campaign.commission_value / 100))
              : campaign.commission_value;
          return (
            <li
              key={tier.id}
              className="flex items-center justify-between gap-[0.75em] px-[0.625em] py-[0.5em] rounded-[0.5em] hover:bg-bg-alt transition-[background-color] duration-150 ease-out"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[0.875em] font-semibold text-text truncate">
                  {tier.name}
                </span>
                <span className="font-mono text-[0.75em] text-text-muted">
                  {formatDZD(tier.price)}
                </span>
              </div>
              <span className="font-mono text-[0.8125em] font-semibold text-accent shrink-0">
                +{formatDZD(commissionForTier, { withSymbol: false })}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
