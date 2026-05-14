"use client";

/**
 * ApplicationDetailOverlay — feature wrapper around the shared
 * `DetailOverlay` primitive, scoped to a single CampaignApplication.
 *
 * Sections (left rail):
 *   1. Pitch    — full pitch in a quoted block.
 *   2. Status   — three-step timeline + rejection callout.
 *   3. Campaign — quick summary of the campaign.
 *
 * Footer: state-aware (Open campaign / Submit a lead / cooldown chip).
 *
 * Composition lives in `application-detail/`:
 *   PitchSection · TimelineSection · CampaignSection · OverlayFooter
 *   plus build-timeline-steps.js + overlay-helpers.js + RejectionCallout.
 */

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { FileText, Activity, Box } from "lucide-react";
import DetailOverlay from "@/components/shared/overlays/DetailOverlay";
import PitchSection from "./application-detail/PitchSection";
import TimelineSection from "./application-detail/TimelineSection";
import CampaignSection from "./application-detail/CampaignSection";
import OverlayFooter from "./application-detail/OverlayFooter";
import { daysUntilCooldownEnds } from "./application-detail/overlay-helpers";

export default function ApplicationDetailOverlay({ open, onClose, application }) {
  const t = useTranslations("Applications.detail");
  const tTable = useTranslations("Applications.table");
  const locale = useLocale();

  // `Date.now()` is impure — read it once via effect (per React 19 rule)
  // and pass into pure helpers.
  const [now, setNow] = useState(null);
  useEffect(() => {
    if (!application) return;
    const raf = requestAnimationFrame(() => setNow(Date.now()));
    return () => cancelAnimationFrame(raf);
  }, [application]);

  const data = useMemo(() => {
    if (!application) return null;
    const c = application.campaign;
    const company = c?.company;
    const category = c?.category_resolved;
    const isApproved = application.status === "approved";
    const isRejected = application.status === "rejected";
    const cooldownDays =
      isRejected && now !== null ? daysUntilCooldownEnds(application.reviewed_at, now) : null;
    const canReapply = isRejected && cooldownDays === 0;
    return {
      campaign: c,
      company,
      categoryName: category
        ? locale === "fr" ? category.name_fr : category.name_en
        : tTable("categoryUnknown"),
      isApproved,
      isRejected,
      cooldownDays,
      canReapply,
    };
  }, [application, locale, tTable, now]);

  if (!application || !data) {
    return <DetailOverlay open={open} onClose={onClose} sections={[]} />;
  }

  const { campaign, company, categoryName, isApproved, isRejected, cooldownDays, canReapply } = data;

  const avatar = company?.logo ? (
    <span className="inline-flex w-[2.5em] h-[2.5em] rounded-[0.5em] overflow-hidden bg-bg shrink-0 border border-border-light">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={company.logo} alt={company.company_name} className="w-full h-full object-cover" />
    </span>
  ) : null;

  const subtitle = company?.company_name
    ? `${company.company_name} · ${categoryName}`
    : categoryName;

  const sections = [
    { key: "pitch",    label: t("sections.pitch"),    icon: <FileText size="0.875em" />, content: <PitchSection application={application} /> },
    { key: "timeline", label: t("sections.timeline"), icon: <Activity size="0.875em" />, content: <TimelineSection application={application} locale={locale} cooldownDays={cooldownDays} canReapply={canReapply} t={t} /> },
    { key: "campaign", label: t("sections.campaign"), icon: <Box size="0.875em" />,      content: <CampaignSection campaign={campaign} t={t} /> },
  ];

  return (
    <DetailOverlay
      open={open}
      onClose={onClose}
      title={campaign.product_name}
      subtitle={subtitle}
      avatar={avatar}
      sections={sections}
      footer={
        <OverlayFooter
          campaign={campaign}
          isApproved={isApproved}
          isRejected={isRejected}
          canReapply={canReapply}
          cooldownDays={cooldownDays}
          t={t}
        />
      }
      defaultSection="pitch"
    />
  );
}
