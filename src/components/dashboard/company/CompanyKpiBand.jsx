"use client";

/**
 * KPI band — top of the Tech Company dashboard.
 *
 * Single row of 4 fulfillment-focused tiles (the partner side has 8; the
 * company side has fewer because the funnel is wider, not deeper):
 *   Commissions paid (lifetime + sparkline + 30d delta)
 *   This month (sparkline + 30d delta)
 *   Active sales partners (count + 30d delta on new approvals)
 *   Leads received this month (sparkline + 30d delta)
 *
 * Same StatCard primitive as the partner side. Loading uses the inlined
 * skeleton band.
 */

import { useTranslations } from "next-intl";
import { Wallet, Calendar, Users, Inbox } from "lucide-react";
import StatCard from "@/components/shared/analytics/StatCard";
import { format, formatNumber } from "@/lib/format/currency";

const ZERO_STATS = {
  commissionsPaid: { value: 0, delta30d: 0, sparkline30d: [] },
  thisMonth:       { value: 0, delta30d: 0, sparkline30d: [] },
  activePartners:  { value: 0, delta30d: 0 },
  leadsThisMonth:  { value: 0, delta30d: 0, sparkline30d: [] },
};

export default function CompanyKpiBand({ stats, isLoading }) {
  const t = useTranslations("Dashboard.CompanyDashboard.kpi");

  if (isLoading) return <KpiSkeleton />;
  const s = stats ?? ZERO_STATS;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1em]">
      {/* Sparkline omitted on the company-side KPI cards: the StatCard
          primitive anchors the spark at bottom-right 70% wide, which
          overlaps short DZD values like "DZD 28 200". Partner-side values
          tend to be longer (lifetime totals) so the collision is invisible
          there. The trend pill + delta footer carry the comparison signal. */}
      <StatCard
        label={t("commissionsPaid")}
        value={format(s.commissionsPaid.value)}
        trend={s.commissionsPaid.delta30d}
        trendLabel={t("vsPrev30d")}
        icon={<Wallet size="1em" strokeWidth={1.75} />}
      />
      <StatCard
        label={t("thisMonth")}
        value={format(s.thisMonth.value)}
        trend={s.thisMonth.delta30d}
        trendLabel={t("vsPrev30d")}
        icon={<Calendar size="1em" strokeWidth={1.75} />}
      />
      <StatCard
        label={t("activePartners")}
        value={formatNumber(s.activePartners.value)}
        trend={s.activePartners.delta30d}
        trendLabel={t("newApprovals")}
        icon={<Users size="1em" strokeWidth={1.75} />}
      />
      <StatCard
        label={t("leadsThisMonth")}
        value={formatNumber(s.leadsThisMonth.value)}
        trend={s.leadsThisMonth.delta30d}
        trendLabel={t("vsPrev30d")}
        icon={<Inbox size="1em" strokeWidth={1.75} />}
      />
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1em]">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-surface border border-border-light rounded-[0.625em] p-[1.375em] flex flex-col gap-[0.875em] shadow-xs"
        >
          <div className="h-[0.75em] w-[40%] rounded-[0.25em] bg-bg-alt" />
          <div className="h-[1.75em] w-[60%] rounded-[0.25em] bg-bg-alt" />
          <div className="h-px bg-border-light" />
          <div className="h-[0.625em] w-[35%] rounded-[0.25em] bg-bg-alt" />
        </div>
      ))}
    </div>
  );
}
