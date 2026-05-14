"use client";

/**
 * LeadDetailOverlay — feature wrapper around the shared `DetailOverlay`.
 *
 * Sections (left rail):
 *   1. Client       — partner's own client identity + notes (always visible).
 *   2. Status       — derived timeline + denial-reason callout.
 *   3. Campaign     — commission terms + tracking window + status.
 *   4. Commission   — money breakdown + state-aware note.
 *
 * Footer: "Open campaign" + state-aware chip (countdown / confirmed / verifying).
 *
 * The four section components, the timeline-step machine, the helpers
 * and the footer chip live in `lead-detail/` so this orchestrator stays
 * focused on data derivation + composition.
 */

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link as IntlLink } from "@/i18n/navigation";
import { User, Activity, Box, CreditCard, ExternalLink, Paperclip } from "lucide-react";
import DetailOverlay from "@/components/shared/overlays/DetailOverlay";
import AppButton from "@/components/ui/Buttons";
import ClientSection from "./lead-detail/ClientSection";
import TimelineSection from "./lead-detail/TimelineSection";
import CampaignSection from "./lead-detail/CampaignSection";
import CommissionSection from "./lead-detail/CommissionSection";
import DocumentsSection from "./lead-detail/documents/DocumentsSection";
import FooterStateChip from "./lead-detail/FooterStateChip";
import SubmitToCompanyButton from "./lead-detail/SubmitToCompanyButton";
import { EXPIRING_SOON_MS, daysLeft, msUntil } from "./lead-detail/lead-detail-helpers";

export default function LeadDetailOverlay({ open, onClose, lead }) {
  const t = useTranslations("Leads.detail");
  const locale = useLocale();
  // `Date.now()` is impure — React 19 forbids calling it in render
  // bodies. We capture it in state via an effect that fires whenever a
  // new lead opens, so all downstream derivations stay pure with respect
  // to their inputs. First-render `now` is null; the second render
  // (one rAF later) populates it. Time-derived chips flash in invisibly.
  const [now, setNow] = useState(null);
  useEffect(() => {
    if (!lead) return;
    const raf = requestAnimationFrame(() => setNow(Date.now()));
    return () => cancelAnimationFrame(raf);
  }, [lead]);

  const data = useMemo(() => {
    if (!lead) return null;
    const c = lead.campaign;
    const company = c?.company;
    const category = c?.category_resolved;
    const remainingMs = now !== null ? msUntil(lead.tracking_window_expires_at, now) : null;
    const isExpiringSoon =
      lead.status === "acknowledged" &&
      remainingMs !== null &&
      remainingMs > 0 &&
      remainingMs <= EXPIRING_SOON_MS;
    return {
      campaign: c,
      company,
      categoryName: category ? (locale === "fr" ? category.name_fr : category.name_en) : null,
      isExpiringSoon,
      daysRemaining: now !== null ? daysLeft(lead.tracking_window_expires_at, now) : null,
    };
  }, [lead, locale, now]);

  if (!lead || !data) {
    return <DetailOverlay open={open} onClose={onClose} sections={[]} />;
  }

  const { campaign, company, categoryName, isExpiringSoon, daysRemaining } = data;
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
    { key: "client",   label: t("sections.client"),   icon: <User size="0.875em" />,        content: <ClientSection lead={lead} locale={locale} t={t} /> },
    { key: "timeline", label: t("sections.timeline"), icon: <Activity size="0.875em" />,    content: <TimelineSection lead={lead} locale={locale} isExpiringSoon={isExpiringSoon} daysRemaining={daysRemaining} t={t} /> },
    { key: "documents", label: t("sections.documents"), icon: <Paperclip size="0.875em" />, content: <DocumentsSection lead={lead} t={t} /> },
    { key: "campaign", label: t("sections.campaign"), icon: <Box size="0.875em" />,         content: <CampaignSection campaign={campaign} categoryName={categoryName} t={t} /> },
    { key: "commission", label: t("sections.commission"), icon: <CreditCard size="0.875em" />, content: <CommissionSection lead={lead} t={t} /> },
  ];

  const isDraft = lead.status === "draft";
  const footer = (
    <>
      <FooterStateChip
        lead={lead}
        isExpiringSoon={isExpiringSoon}
        daysRemaining={daysRemaining}
        t={t}
      />
      <IntlLink href={campaignHref}>
        <AppButton variant="secondary" size="sm">
          <span className="inline-flex items-center gap-[0.375em]">
            <ExternalLink className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
            {t("openCampaign")}
          </span>
        </AppButton>
      </IntlLink>
      {isDraft && <SubmitToCompanyButton lead={lead} onSubmitted={onClose} t={t} />}
    </>
  );

  return (
    <DetailOverlay
      open={open}
      onClose={onClose}
      title={lead.client_full_name}
      subtitle={subtitle}
      avatar={avatar}
      sections={sections}
      footer={footer}
      defaultSection="client"
    />
  );
}
