"use client";

/**
 * Cell components for the company-side /leads inbox table.
 *
 * Reuse policy: the partner-side `leads-page/cells.jsx` ships a
 * `ClientCell` and `CampaignCell` already, but the company-side rows
 * lead with the *partner who submitted the lead* (the company is
 * judging incoming leads from many partners), so the column order is:
 * Partner · Client · Campaign · Reservation · Submitted · Status.
 *
 * `ReservationCell` is the noteworthy one — it shows the per-row
 * reservation amount in mono and reveals a "Balance after: X" preview
 * on hover (Mercury Bill Pay confirm pattern). When the wallet's
 * available balance is below the reservation, the cell flips to a
 * muted amber state so the row reads as "blocked" before the user
 * even tries to click Reserve & View.
 */

import Avatar from "@/components/shared/data-display/Avatar";
import { useState } from "react";
import { Lock } from "lucide-react";
import { format as formatDZD } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

/** Partner cell: avatar + name. Mirrors `applications-page/PartnerCell`
 *  visually so the two tables feel consistent. */
export function CompanyLeadPartnerCell({ row, fallback }) {
  const p = row.partner;
  const name = p ? `${p.first_name} ${p.last_name}` : (fallback ?? "—");
  return (
    <div className="flex items-center gap-[0.625em] min-w-0">
      {p?.profile_photo ? (
        <span className="inline-flex w-[2em] h-[2em] rounded-full overflow-hidden bg-bg shrink-0 border border-border-light">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.profile_photo} alt={name} className="w-full h-full object-cover" />
        </span>
      ) : (
        <Avatar name={name} size="sm" />
      )}
      <span className="text-[0.875em] font-semibold text-text truncate">{name}</span>
    </div>
  );
}

/** Client cell — pre-reservation: full blackout (no name, no company,
 *  no contact). Renders a locked placeholder with a lock icon and a
 *  blurred shimmer hint so the company knows there's a real client
 *  behind it but not a single field leaks. Post-reservation: name +
 *  phone revealed. */
export function CompanyLeadClientCell({ row, t }) {
  if (!row.contact_revealed) {
    return (
      <div className="flex items-center gap-[0.5em] min-w-0">
        <span
          aria-hidden="true"
          className="inline-flex items-center justify-center shrink-0 w-[1.75em] h-[1.75em] rounded-full bg-bg-alt text-text-muted"
        >
          <Lock className="w-[0.75em] h-[0.75em]" strokeWidth={2} />
        </span>
        <div className="flex flex-col min-w-0">
          {/* Two blurred bars + a small "Reserve to reveal" caption.
              Bars are inert div widths so even the DOM gives nothing
              identifiable away. */}
          <span className="block h-[0.625em] w-[7em] bg-bg-alt rounded-[0.25em] blur-[1px] mb-[0.25em]" />
          <span className="text-[0.6875em] text-text-muted font-body">
            {t("locked")}
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-[0.875em] font-semibold text-text truncate">
        {row.client_full_name}
      </span>
      {row.client_phone && (
        <span className="font-mono text-[0.6875em] tabular-nums truncate text-text-secondary">
          {row.client_phone}
        </span>
      )}
    </div>
  );
}

/** Campaign cell: compact product name + tier name. */
export function CompanyLeadCampaignCell({ row }) {
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-[0.8125em] font-medium text-text truncate">
        {row.campaign?.product_name}
      </span>
      {row.pricing_tier_resolved && row.campaign?.tier_count > 1 && (
        <span className="text-[0.6875em] text-text-muted truncate">
          {row.pricing_tier_resolved.name}
        </span>
      )}
    </div>
  );
}

/** Reservation cell: amount in mono + on-hover Balance-after preview.
 *  Flips amber when reservation > available. The hover preview is a
 *  CSS-positioned tooltip — no portal needed (lives inside the cell). */
export function ReservationCell({ row, available, t }) {
  const [hovered, setHovered] = useState(false);
  const reservation = row.total_reservation ?? 0;
  const balanceAfter = (available ?? 0) - reservation;
  const insufficient = available != null && balanceAfter < 0;

  // Only actionable rows get the hover preview. Once acknowledged the
  // reservation is a historical fact; "balance after" is meaningless.
  const isActionable =
    row.status === "submitted" || row.status === "pending_escrow";

  return (
    <span
      className={cn(
        "relative inline-flex items-baseline gap-[0.25em] font-mono text-[0.8125em] font-semibold tabular-nums",
        insufficient && isActionable ? "text-status-pending-text" : "text-text",
      )}
      onMouseEnter={() => isActionable && available != null && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {formatDZD(reservation, { withSymbol: false })}
      {hovered && (
        <span
          role="tooltip"
          className="absolute bottom-full right-0 mb-[0.5em] z-20 flex flex-col gap-[0.25em] px-[0.875em] py-[0.625em] bg-text text-cta-text rounded-[0.5em] shadow-md text-[0.75em] font-body min-w-[12em] pointer-events-none whitespace-nowrap"
        >
          <span className="opacity-70 font-body">{t("balanceAfter")}</span>
          <span className="font-mono tabular-nums font-semibold">
            {formatDZD(balanceAfter)}
          </span>
          {insufficient && (
            <span className="font-body opacity-90 text-[0.6875em] mt-[0.25em] whitespace-normal">
              {t("insufficient")}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
