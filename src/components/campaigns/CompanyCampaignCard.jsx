"use client";

/**
 * CompanyCampaignCard — company-side card on /campaigns.
 *
 * Thin wrapper around the shared `CampaignCardShell`. Owns the
 * company-specific zones:
 *   - topRow      : 16:9 cover image + StatusBadge overlay (top-right) +
 *                   category overline + product-name handled by the shell.
 *   - footerLeft  : "N partners · M leads" meta line.
 *   - footerRight : conversion-rate pill (mono, accent when >0%) + kebab
 *                   actions menu (Edit · Pause/Resume · Close).
 *
 * The kebab handles its own click-stop so it doesn't trigger the card's
 * `<Link>` navigation. Verification gate is honored: when `disabled` is
 * true (company in pending_review / unverified email), the kebab still
 * renders but is visually muted and Pause/Resume/Close confirms are
 * disabled. Edit stays clickable so the company can keep prepping a draft.
 */

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Users, Inbox } from "lucide-react";
import CampaignCardShell from "@/components/shared/data-display/CampaignCardShell";
import StatusBadge from "@/components/shared/data-display/StatusBadge";
import { format as formatDZD, formatNumber } from "@/lib/format/currency";
import { cn } from "@/lib/utils";
import CampaignActionsMenu from "./CampaignActionsMenu";

export default function CompanyCampaignCard({ campaign, actionsDisabled }) {
  const t = useTranslations("Campaigns.companyList.card");
  const locale = useLocale();

  const category = campaign.category_resolved;
  const categoryLabel = category
    ? (locale === "fr" ? category.name_fr : category.name_en)
    : "";

  const commissionLabel =
    campaign.commission_type === "percentage"
      ? t("pctCommission", { value: campaign.commission_value })
      : t("flatCommission", { value: formatDZD(campaign.commission_value) });

  return (
    <CampaignCardShell
      href={`/campaigns/${campaign.slug}`}
      title={campaign.product_name}
      description={campaign.description}
      topRow={
        <div className="flex flex-col gap-[0.625em]">
          {/* Cover image — 16:9 with status badge floating top-right.
              Bg-alt fallback so the slot still has presence when the
              image is broken or missing. */}
          <div className="relative w-full aspect-[16/9] rounded-[0.5em] overflow-hidden bg-bg-alt">
            {campaign.product_image && (
              <Image
                src={campaign.product_image}
                alt=""
                fill
                sizes="(min-width:1150px) 22em, (min-width:640px) 50vw, 100vw"
                className="object-cover"
              />
            )}
            <span className="absolute top-[0.5em] right-[0.5em]">
              <StatusBadge status={campaign.status} className="text-[0.6875em] shadow-xs" />
            </span>
          </div>
          {categoryLabel && (
            <span className="text-[0.6875em] uppercase tracking-[0.06em] text-text-muted font-semibold">
              {categoryLabel}
            </span>
          )}
        </div>
      }
      commissionLine={
        <span className="font-mono text-[0.875em] font-semibold tabular-nums text-accent">
          {commissionLabel}
        </span>
      }
      footerLeft={
        <span className="inline-flex items-center gap-[0.625em] text-[0.6875em] text-text-muted">
          <span className="inline-flex items-center gap-[0.25em]">
            <Users size="0.875em" strokeWidth={1.75} />
            {t("activePartners", { count: formatNumber(campaign.active_partners_count) })}
          </span>
          <span className="inline-flex items-center gap-[0.25em]">
            <Inbox size="0.875em" strokeWidth={1.75} />
            {t("leads", { count: formatNumber(campaign.leads_count) })}
          </span>
        </span>
      }
      footerRight={
        <span className="inline-flex items-center gap-[0.5em]">
          <span
            className={cn(
              "inline-flex items-center gap-[0.25em] h-[1.5em] px-[0.5em] rounded-[0.375em]",
              "font-mono text-[0.6875em] font-semibold tabular-nums",
              campaign.conversion_rate > 0
                ? "bg-accent-light text-accent-text"
                : "bg-bg-alt text-text-muted",
            )}
            title={t("conversionRateTooltip")}
          >
            {`${campaign.conversion_rate}%`}
          </span>
          <CampaignActionsMenu campaign={campaign} disabled={actionsDisabled} />
        </span>
      }
    />
  );
}
