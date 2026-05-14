"use client";

/**
 * KpiStrip — 4-up summary above the /partner-links table.
 *
 * Aggregates totals across ALL the partner's links: total clicks, total
 * conversions, average conversion rate, total commission earned. Pure
 * derivation from the rows already in scope — no extra fetch.
 *
 * Reuses the shared StatCard primitive so the look matches /dashboard.
 * Trend is intentionally omitted (V1) — we don't have a "previous period"
 * baseline in the mock data, and faking one would mislead the partner.
 * StatCard hides the bottom divider + label when `trend` is null.
 */

import { useMemo } from "react";
import { MousePointerClick, Target, Percent, Coins } from "lucide-react";
import StatCard from "@/components/shared/analytics/StatCard";

function fmt(n) {
  return Number(n ?? 0).toLocaleString("fr-DZ");
}

export default function KpiStrip({ rows = [], totalCommission = 0, t }) {
  const totals = useMemo(() => {
    const clicks = rows.reduce((m, r) => m + (r.total_clicks ?? 0), 0);
    const conversions = rows.reduce((m, r) => m + (r.total_conversions ?? 0), 0);
    const rate = clicks > 0 ? Math.round((conversions / clicks) * 1000) / 10 : 0;
    return { clicks, conversions, rate };
  }, [rows]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1em]">
      <StatCard
        label={t("kpi.clicks")}
        value={fmt(totals.clicks)}
        icon={<MousePointerClick className="w-[1em] h-[1em]" strokeWidth={1.75} />}
      />
      <StatCard
        label={t("kpi.conversions")}
        value={fmt(totals.conversions)}
        icon={<Target className="w-[1em] h-[1em]" strokeWidth={1.75} />}
      />
      <StatCard
        label={t("kpi.rate")}
        value={`${totals.rate}%`}
        icon={<Percent className="w-[1em] h-[1em]" strokeWidth={1.75} />}
      />
      <StatCard
        label={t("kpi.commission")}
        value={`${fmt(totalCommission)} DA`}
        icon={<Coins className="w-[1em] h-[1em]" strokeWidth={1.75} />}
        highlight
      />
    </div>
  );
}
