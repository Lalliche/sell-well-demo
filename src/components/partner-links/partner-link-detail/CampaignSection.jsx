"use client";

/**
 * CampaignSection — commission terms + tracking window + campaign status
 * for a single PartnerLink. Mirrors the shape of the lead-detail's
 * CampaignSection so the two overlays read consistently.
 *
 * The "Open campaign" CTA lives in the overlay footer, not here.
 */

import StatusBadge from "@/components/shared/data-display/StatusBadge";
import { formatCommissionTerms } from "./partner-link-helpers";

export default function CampaignSection({ campaign, t }) {
  return (
    <div className="flex flex-col gap-[1em]">
      <dl className="grid grid-cols-2 gap-x-[1.5em] gap-y-[0.875em]">
        <Field
          label={t("campaign.commissionLabel")}
          value={formatCommissionTerms(campaign, t)}
        />
        <Field
          label={t("campaign.trackingWindow")}
          value={t("campaign.trackingWindowValue", { days: campaign.tracking_window_days })}
        />
        <div className="flex flex-col gap-[0.25em] min-w-0">
          <dt className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted">
            {t("campaign.campaignStatus")}
          </dt>
          <dd>
            <StatusBadge status={campaign.status} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="flex flex-col gap-[0.25em] min-w-0">
      <dt className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted">
        {label}
      </dt>
      <dd className="text-[0.875em] font-semibold text-text">{value}</dd>
    </div>
  );
}
