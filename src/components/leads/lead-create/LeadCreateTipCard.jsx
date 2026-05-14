"use client";

/**
 * Sticky right-rail tip card for /leads/new. Empty state explains the
 * flow; once a campaign is selected, surfaces the campaign's economics
 * (commission, tracking window, tier count) inline.
 */

import { Lightbulb } from "lucide-react";

export default function LeadCreateTipCard({ selectedCampaign, t }) {
  if (!selectedCampaign) {
    return (
      <div className="bg-bg-alt/40 border border-border-light rounded-[0.625em] p-[1.25em] flex flex-col gap-[0.75em]">
        <Header label={t("section.context")} />
        <p className="text-[0.8125em] text-text-secondary leading-[1.55]">
          {t("description")}
        </p>
      </div>
    );
  }
  const c = selectedCampaign;
  const commission =
    c.commission_type === "percentage"
      ? `${c.commission_value}%`
      : `${Number(c.commission_value).toLocaleString("fr-DZ")} DA`;
  return (
    <div className="bg-surface border border-border-light rounded-[0.625em] shadow-xs p-[1.25em] flex flex-col gap-[0.875em]">
      <Header label={c.product_name} />
      <dl className="flex flex-col gap-[0.5em] border-t border-border-light pt-[0.875em]">
        <Row label="Commission" value={commission} mono />
        <Row label="Tracking window" value={`${c.tracking_window_days} days`} mono />
        <Row
          label="Tiers"
          value={c.pricing_tiers.length === 1 ? "Standard" : `${c.pricing_tiers.length} options`}
        />
      </dl>
    </div>
  );
}

function Header({ label }) {
  return (
    <div className="flex items-center gap-[0.5em]">
      <Lightbulb className="w-[1.125em] h-[1.125em] text-accent" strokeWidth={1.75} />
      <span className="text-[0.8125em] font-semibold text-text">{label}</span>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-[1em]">
      <span className="text-[0.75em] text-text-muted">{label}</span>
      <span
        className={`text-[0.8125em] font-semibold text-text ${mono ? "font-mono tabular-nums" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
