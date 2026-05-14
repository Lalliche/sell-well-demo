"use client";

/**
 * PerformanceSection — KPI strip (4 numbers) + 30-day click trend area
 * chart for a single PartnerLink.
 *
 * The strip shows: total clicks · conversions · conversion rate ·
 * commission earned (sum of attributed sales). The chart sits beneath
 * and uses the shared Sparkline primitive in `inline` mode at a
 * deliberately larger size so the area has room to breathe.
 *
 * Pure presentation — totals come from props, computed by the orchestrator
 * once so this component doesn't trigger refetches.
 */

import Sparkline from "@/components/shared/analytics/Sparkline";
import { fmtDA } from "./partner-link-helpers";

export default function PerformanceSection({ link, totalCommission, t }) {
  const stats = [
    { key: "clicks",      label: t("performance.clicks"),      value: fmtDA(link.total_clicks) },
    { key: "conversions", label: t("performance.conversions"), value: fmtDA(link.total_conversions) },
    { key: "rate",        label: t("performance.rate"),        value: `${link.conversion_rate ?? 0}%` },
    { key: "commission",  label: t("performance.commission"),  value: `${fmtDA(totalCommission)} DA`, highlight: true },
  ];

  return (
    <div className="flex flex-col gap-[1.25em]">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-[0.75em]">
        {stats.map((s) => (
          <KpiTile key={s.key} label={s.label} value={s.value} highlight={s.highlight} />
        ))}
      </div>

      <div className="flex flex-col gap-[0.5em] bg-surface border border-border-light rounded-[0.5em] p-[1em]">
        <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted">
          {t("performance.trendLabel")}
        </span>
        <Sparkline
          data={link.click_buckets ?? []}
          mode="inline"
          width="100%"
          height="6em"
          ariaLabel={t("performance.trendAria")}
        />
      </div>
    </div>
  );
}

function KpiTile({ label, value, highlight }) {
  return (
    <div className="flex flex-col gap-[0.375em] bg-bg-alt/40 border border-border-light rounded-[0.5em] p-[0.875em]">
      <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted">
        {label}
      </span>
      <span className={
        "text-[1.125em] font-semibold font-mono tabular-nums leading-none " +
        (highlight ? "text-accent" : "text-text")
      }>
        {value}
      </span>
    </div>
  );
}
