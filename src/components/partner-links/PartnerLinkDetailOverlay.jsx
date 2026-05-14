"use client";

/**
 * PartnerLinkDetailOverlay — feature wrapper around the shared
 * `DetailOverlay` primitive, scoped to a single PartnerLink.
 *
 * Sections (left rail):
 *   1. Link        — full URL + copy pill + open-in-new-tab + meta
 *   2. Performance — KPI strip + 30-day click trend area chart
 *   3. Sales       — flat list of attributed PartnerLinkSale rows
 *   4. Campaign    — commission terms + tracking window + campaign status
 *
 * Footer: state-aware "Open campaign" link to the marketplace detail.
 *
 * Composition lives in `partner-link-detail/`:
 *   LinkSection · PerformanceSection · SalesSection · CampaignSection
 *   plus partner-link-helpers.js (pure formatters).
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { Link as IntlLink } from "@/i18n/navigation";
import { Link as LinkIcon, BarChart3, Receipt, Box, ExternalLink } from "lucide-react";
import DetailOverlay from "@/components/shared/overlays/DetailOverlay";
import AppButton from "@/components/ui/Buttons";
import { fetchPartnerLinkSales } from "@/lib/mock/partner-links";
import LinkSection from "./partner-link-detail/LinkSection";
import PerformanceSection from "./partner-link-detail/PerformanceSection";
import SalesSection from "./partner-link-detail/SalesSection";
import CampaignSection from "./partner-link-detail/CampaignSection";

export default function PartnerLinkDetailOverlay({ open, onClose, link }) {
  const t = useTranslations("PartnerLinks.detail");
  const locale = useLocale();

  // Sum of attributed commissions for this link — drives the 4th KPI tile
  // in the Performance section. Fetched once per open.
  const { data: sales = [] } = useQuery({
    queryKey: ["partner-link-sales", { linkId: link?.id }],
    queryFn: () => fetchPartnerLinkSales({ linkId: link.id }),
    enabled: !!link?.id,
  });
  const totalCommission = useMemo(
    () => sales.reduce((m, s) => m + (s.commission_amount ?? 0), 0),
    [sales],
  );

  if (!link) {
    return <DetailOverlay open={open} onClose={onClose} sections={[]} />;
  }

  const campaign = link.campaign;
  const company = campaign?.company;
  const campaignHref = `/marketplace/${campaign.slug}`;

  const avatar = company?.logo ? (
    <span className="inline-flex w-[2.5em] h-[2.5em] rounded-[0.5em] overflow-hidden bg-bg shrink-0 border border-border-light">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={company.logo} alt={company.company_name} className="w-full h-full object-cover" />
    </span>
  ) : null;

  const subtitle = company?.company_name
    ? `${campaign.product_name} · ${company.company_name}`
    : campaign.product_name;

  const sections = [
    { key: "link",        label: t("sections.link"),        icon: <LinkIcon size="0.875em" />,   content: <LinkSection link={link} locale={locale} t={t} /> },
    { key: "performance", label: t("sections.performance"), icon: <BarChart3 size="0.875em" />,  content: <PerformanceSection link={link} totalCommission={totalCommission} t={t} /> },
    { key: "sales",       label: t("sections.sales"),       icon: <Receipt size="0.875em" />,    content: <SalesSection link={link} locale={locale} t={t} /> },
    { key: "campaign",    label: t("sections.campaign"),    icon: <Box size="0.875em" />,        content: <CampaignSection campaign={campaign} t={t} /> },
  ];

  const footer = (
    <IntlLink href={campaignHref}>
      <AppButton variant="secondary" size="sm">
        <span className="inline-flex items-center gap-[0.375em]">
          <ExternalLink className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
          {t("openCampaign")}
        </span>
      </AppButton>
    </IntlLink>
  );

  return (
    <DetailOverlay
      open={open}
      onClose={onClose}
      title={campaign.product_name}
      subtitle={subtitle}
      avatar={avatar}
      sections={sections}
      footer={footer}
      defaultSection="link"
    />
  );
}
