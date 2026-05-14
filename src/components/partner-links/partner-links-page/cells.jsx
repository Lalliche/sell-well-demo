"use client";

/**
 * Table cell components for /partner-links — Campaign, Link, Rate.
 * Pure presentation, no data fetching. Mirrors the cells.jsx layout
 * from /leads so the two pages read consistently.
 */

import CopyPill from "@/components/shared/forms/CopyPill";
import Sparkline from "@/components/shared/analytics/Sparkline";
import { cn } from "@/lib/utils";

/** Campaign + company + paused chip when applicable. */
export function CampaignCell({ row }) {
  const campaign = row.campaign;
  const company = campaign.company;
  const isPaused = campaign.status !== "active";
  return (
    <div className="flex items-center gap-[0.5em] min-w-0">
      {company?.logo ? (
        <span className="inline-flex w-[1.75em] h-[1.75em] rounded-[0.375em] overflow-hidden bg-bg shrink-0 border border-border-light">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={company.logo} alt={company.company_name} className="w-full h-full object-cover" />
        </span>
      ) : (
        <span className="inline-flex w-[1.75em] h-[1.75em] rounded-[0.375em] bg-bg-alt shrink-0" />
      )}
      <div className="flex flex-col gap-[0.125em] min-w-0">
        <span className="text-[0.8125em] font-semibold text-text truncate">
          {campaign.product_name}
        </span>
        <span className="text-[0.6875em] text-text-muted truncate font-body">
          {company?.company_name}
          {isPaused ? ` · ${campaign.status}` : ""}
        </span>
      </div>
    </div>
  );
}

/** Copy-pill + truncated URL. Stops row-click propagation so copying
 *  doesn't open the detail overlay. */
export function LinkCell({ row, labels }) {
  const display = row.url.replace(/^sellwell\.dz\//, "/");
  return (
    <div onClick={(e) => e.stopPropagation()} className="min-w-0">
      <CopyPill
        value={`https://${row.url}`}
        displayValue={display}
        labels={labels}
        size="sm"
        className="max-w-[14em]"
      />
    </div>
  );
}

/** Conversion rate + sparkline of last-30-day clicks. */
export function PerformanceCell({ row, ariaLabel }) {
  const rate = row.conversion_rate ?? 0;
  return (
    <div className="flex items-center gap-[0.625em]">
      <span className={cn(
        "font-mono tabular-nums text-[0.8125em] font-semibold",
        rate > 0 ? "text-text" : "text-text-muted",
      )}>
        {rate}%
      </span>
      <Sparkline
        data={row.click_buckets}
        mode="inline"
        width="4em"
        height="1.25em"
        ariaLabel={ariaLabel}
      />
    </div>
  );
}
