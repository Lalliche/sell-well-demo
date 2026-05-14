"use client";

/**
 * Overview section of the admin campaign detail overlay. Composes the
 * partner-facing DetailHero + DetailContentSections + an admin KPI strip
 * (commission · partners · leads · converted · tracking window · partner
 * links). Extracted from AdminCampaignDetailOverlay to keep that file
 * under the ~250-line cap.
 */

import { useMemo } from "react";
import StatusBadge from "@/components/shared/data-display/StatusBadge";
import DetailHero from "@/components/marketplace/detail/DetailHero";
import DetailContentSections from "@/components/marketplace/detail/DetailContentSections";

function Field({ label, children, mono = false }) {
  return (
    <div className="flex flex-col gap-[0.25em]">
      <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
        {label}
      </span>
      <span className={mono ? "text-[0.875em] text-text font-mono tabular-nums" : "text-[0.875em] text-text"}>
        {children ?? <span className="text-text-muted">—</span>}
      </span>
    </div>
  );
}

export default function AdminCampaignOverviewSection({ campaign, t }) {
  const commissionLabel = useMemo(() => {
    if (campaign.commission_type === "percentage") {
      return `${campaign.commission_value}%`;
    }
    return `${campaign.commission_value} DA`;
  }, [campaign.commission_type, campaign.commission_value]);

  return (
    <div className="flex flex-col gap-[1.5em]">
      <DetailHero campaign={campaign} />

      <div className="flex items-center gap-[0.5em]">
        <StatusBadge status={campaign.status} label={t(`statuses.${campaign.status}`)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-[1em] bg-bg-alt rounded-[0.75em] p-[1em]">
        <Field label={t("overlay.commission")} mono>{commissionLabel}</Field>
        <Field label={t("overlay.partnersActive")} mono>{campaign.active_partners_count ?? 0}</Field>
        <Field label={t("overlay.leadsTotal")} mono>{campaign.leads_count ?? 0}</Field>
        <Field label={t("overlay.convertedTotal")} mono>{campaign.converted_count ?? 0}</Field>
        <Field label={t("overlay.trackingWindow")} mono>
          {t("overlay.trackingWindowValue", { days: campaign.tracking_window_days })}
        </Field>
        <Field label={t("overlay.partnerLinks")}>
          {campaign.partner_links_enabled ? t("overlay.partnerLinksOn") : t("overlay.partnerLinksOff")}
        </Field>
      </div>

      <DetailContentSections campaign={campaign} />
    </div>
  );
}
