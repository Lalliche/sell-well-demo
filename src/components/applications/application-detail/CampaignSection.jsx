"use client";

/** CampaignSection — quick campaign summary on the application overlay. */

import StatusBadge from "@/components/shared/data-display/StatusBadge";

export default function CampaignSection({ campaign, t }) {
  const commission =
    campaign.commission_type === "percentage"
      ? t("campaign.pctCommission", { value: campaign.commission_value })
      : t("campaign.flatCommission", {
          value: Number(campaign.commission_value).toLocaleString("fr-DZ"),
        });

  const rows = [
    { label: t("campaign.commission"), value: commission, mono: true },
    {
      label: t("campaign.trackingWindow"),
      value: t("campaign.trackingWindowValue", { days: campaign.tracking_window_days }),
      mono: true,
    },
    {
      label: t("campaign.partnerLinks"),
      value: campaign.partner_links_enabled
        ? t("campaign.partnerLinksAvailable")
        : t("campaign.partnerLinksUnavailable"),
    },
    {
      label: t("campaign.campaignStatus"),
      value: <StatusBadge status={campaign.status} />,
      isNode: true,
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-[1.5em] gap-y-[0.875em]">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-[0.25em] min-w-0">
          <dt className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
            {row.label}
          </dt>
          <dd
            className={
              row.isNode
                ? ""
                : `text-[0.875em] font-semibold text-text ${row.mono ? "font-mono tabular-nums" : ""}`
            }
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
