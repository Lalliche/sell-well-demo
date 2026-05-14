"use client";

/**
 * CommissionSection — money breakdown for one lead.
 * Single-tier vs multi-tier label flip on the price row.
 * State-aware footnote that explains what the numbers actually mean
 * given the lead's current status.
 */

import { fmtDA } from "./lead-detail-helpers";

const NOTE_KEY_BY_STATUS = {
  converted: "commission.confirmedNote",
  converted_verified: "commission.verifiedNote",
  not_converted: "commission.lostNote",
  disputed_verifying: "commission.disputedNote",
  expired_verifying: "commission.disputedNote",
  expired: "commission.expiredNote",
};

export default function CommissionSection({ lead, t }) {
  const tier = lead.pricing_tier_resolved;
  const isMultiTier = (lead.campaign?.tier_count ?? 1) > 1;
  const isFinal = lead.status === "converted" || lead.status === "converted_verified";
  const showActual = isFinal && typeof lead.actual_sale_amount === "number";
  const noteKey = NOTE_KEY_BY_STATUS[lead.status] ?? "commission.expectedNote";

  return (
    <div className="flex flex-col gap-[1em]">
      <dl className="flex flex-col gap-[0.625em]">
        {tier && (
          <Row
            label={isMultiTier ? t("commission.tierPrice") : t("commission.salePrice")}
            value={`${fmtDA(tier.price)} DA`}
          />
        )}
        <Row label={t("commission.yourCommission")} value={`${fmtDA(lead.commission_amount)} DA`} highlight />
        <Row label={t("commission.platformFee")} value={`${fmtDA(lead.platform_fee_amount)} DA`} muted />
        <Row label={t("commission.totalReservation")} value={`${fmtDA(lead.total_reservation)} DA`} muted />
        {showActual && (
          <Row label={t("commission.actualSale")} value={`${fmtDA(lead.actual_sale_amount)} DA`} />
        )}
      </dl>
      <p className="text-[0.75em] text-text-muted leading-[1.55]">{t(noteKey)}</p>
    </div>
  );
}

function Row({ label, value, highlight, muted }) {
  return (
    <div className="flex items-center justify-between gap-[1em] border-b border-border-light pb-[0.5em] last:border-0 last:pb-0">
      <span className="text-[0.8125em] text-text-secondary">{label}</span>
      <span
        className={`font-mono tabular-nums text-[0.875em] ${
          highlight ? "text-accent font-semibold" : muted ? "text-text-muted" : "text-text font-medium"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
