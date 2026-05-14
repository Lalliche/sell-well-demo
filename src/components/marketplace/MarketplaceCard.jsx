"use client";

/**
 * MarketplaceCard — partner-facing campaign card on /marketplace.
 *
 * Thin wrapper around the shared `CampaignCardShell` (`shared/data-display/`).
 * Owns the partner-specific zones:
 *   - topRow      : company logo (with shared layoutId for the detail-page
 *                   morph) + company name + category overline.
 *   - footerLeft  : active-partners count line.
 *   - footerRight : either the partner's StatusBadge (when they've already
 *                   applied) OR the black "View" CTA pill.
 *
 * Everything else (frame, hover, heading, description, commission line,
 * Link wrapper, focus ring) is owned by the shell so the partner card +
 * the company card share the same visual language without duplicating CSS.
 */

import Image from "next/image";
import { motion } from "motion/react";
import { useTranslations, useLocale } from "next-intl";
import { Link2, Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import CampaignCardShell from "@/components/shared/data-display/CampaignCardShell";
import StatusBadge from "@/components/shared/data-display/StatusBadge";
import { format as formatDZD, formatNumber } from "@/lib/format/currency";

export default function MarketplaceCard({ campaign }) {
  const t = useTranslations("Marketplace.card");
  const locale = useLocale();

  const company  = campaign.company;
  const category = campaign.category_resolved;
  const categoryLabel = category
    ? (locale === "fr" ? category.name_fr : category.name_en)
    : "";

  const commissionLabel =
    campaign.commission_type === "percentage"
      ? t("pctCommission", { value: campaign.commission_value })
      : t("flatCommission", { value: formatDZD(campaign.commission_value) });

  const appStatus = campaign.partner_application_status;

  return (
    <CampaignCardShell
      href={`/marketplace/${campaign.slug}`}
      title={campaign.product_name}
      description={campaign.description}
      topRow={
        <div className="flex items-center gap-[0.625em] min-w-0">
          {company?.logo ? (
            <motion.span
              layoutId={`marketplace-card-logo-${campaign.id}`}
              className="relative shrink-0 w-[2em] h-[2em] rounded-[0.375em] overflow-hidden bg-bg-alt"
            >
              <Image
                src={company.logo}
                alt=""
                fill
                sizes="2em"
                className="object-cover"
              />
            </motion.span>
          ) : (
            <span className="shrink-0 w-[2em] h-[2em] rounded-[0.375em] bg-bg-alt" />
          )}
          <div className="flex-1 min-w-0 flex flex-col gap-[0.0625em]">
            <span className="text-[0.75em] font-medium text-text-secondary truncate">
              {company?.company_name ?? "—"}
            </span>
            <span className="text-[0.6875em] uppercase tracking-[0.06em] text-text-muted font-semibold">
              {categoryLabel}
            </span>
          </div>
        </div>
      }
      commissionLine={
        <>
          <span className="font-mono text-[0.875em] font-semibold tabular-nums text-accent">
            {commissionLabel}
          </span>
          {campaign.partner_links_enabled && (
            <PartnerLinkBadge label={t("partnerLinks")} />
          )}
        </>
      }
      footerLeft={
        <span className="inline-flex items-center gap-[0.25em] text-[0.6875em] text-text-muted">
          <Users size="0.875em" strokeWidth={1.75} />
          {t("activePartners", {
            count: formatNumber(campaign.active_partners_count),
          })}
        </span>
      }
      footerRight={
        appStatus ? (
          <StatusBadge status={appStatus} className="text-[0.6875em]" />
        ) : (
          /* View CTA — black pill matching the dashboard's Withdraw button
           * shape. The whole card is already a <Link> via the shell, so
           * this is purely visual; the shell's group-hover drives the
           * transitions. */
          <span
            aria-hidden="true"
            className={cn(
              "inline-flex items-center gap-[0.5em]",
              "h-[2.5em] px-[1.125em] rounded-[0.5em]",
              "text-[0.8125em] font-semibold tracking-[-0.005em]",
              "bg-cta text-cta-text shadow-sm",
              "group-hover:bg-cta-hover group-hover:shadow-md",
              "transition-[background-color,box-shadow] duration-150 ease-out",
            )}
          >
            {t("view")}
            <ArrowRight
              size="0.9375em"
              strokeWidth={2.25}
              className="transition-transform duration-150 ease-out group-hover:translate-x-[0.125em]"
            />
          </span>
        )
      }
    />
  );
}

function PartnerLinkBadge({ label }) {
  return (
    <span className="inline-flex items-center gap-[0.25em] px-[0.5em] py-[0.1875em] rounded-full bg-accent-light text-accent-text text-[0.6875em] font-semibold">
      <Link2 size="0.75em" strokeWidth={2} />
      {label}
    </span>
  );
}
