"use client";

/**
 * KPI band — top of the Sales Partner dashboard.
 *
 * Two rows:
 *   Row 1 (money)        — Total earned · This month · Available · Pending
 *   Row 2 (operational)  — Clicks · Conversions · Conv rate · Avg / conv
 *
 * Sources its data from `fetchPartnerStats(userId)` (called by the parent
 * page via useQuery so this component stays presentational). The shape
 * passed in is the locked wire shape from `mock/partner-stats.js`.
 *
 * Loading: each card renders its own skeleton via the StatCard primitive's
 * existing styling — but for V1 we just render a flat skeleton row when
 * `stats` is null/undefined. Real per-card skeleton comes later if the
 * user wants it.
 *
 * `onWithdrawClick` is fired when the user clicks the Withdraw CTA on the
 * Available tile (only shown when value > 0 AND hasBanking is true).
 */

import { useTranslations } from "next-intl";
import {
  Wallet,
  Calendar,
  ArrowDownToLine,
  Hourglass,
  MousePointerClick,
  CheckCircle2,
  Percent,
  Coins,
} from "lucide-react";
import StatCard from "@/components/shared/analytics/StatCard";
import { format, formatNumber } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

const ZERO_STATS = {
  totalEarned:         { value: 0, delta30d: 0, sparkline30d: [] },
  thisMonth:           { value: 0, delta30d: 0, sparkline30d: [] },
  availableToWithdraw: { value: 0, hasBanking: false },
  pendingInEscrow:     { value: 0, count: 0 },
  clicks:              { value: 0, delta30d: 0 },
  conversions:         { value: 0, delta30d: 0 },
  conversionRate:      { value: 0, delta30d: 0 },
  avgPerConversion:    { value: 0, delta30d: 0 },
};

export default function KpiBand({ stats, isLoading, onWithdrawClick }) {
  const t = useTranslations("Dashboard.PartnerDashboard.kpi");

  if (isLoading) return <KpiSkeleton />;
  const s = stats ?? ZERO_STATS;

  return (
    <div className="flex flex-col gap-[1em]">
      {/* Money row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1em]">
        <StatCard
          label={t("totalEarned")}
          value={format(s.totalEarned.value)}
          trend={s.totalEarned.delta30d}
          trendLabel={t("vsPrev30d")}
          sparkline={s.totalEarned.sparkline30d}
          icon={<Wallet size="1em" strokeWidth={1.75} />}
        />
        <StatCard
          label={t("thisMonth")}
          value={format(s.thisMonth.value)}
          trend={s.thisMonth.delta30d}
          trendLabel={t("vsPrev30d")}
          sparkline={s.thisMonth.sparkline30d}
          icon={<Calendar size="1em" strokeWidth={1.75} />}
        />
        <StatCard
          label={t("available")}
          value={format(s.availableToWithdraw.value)}
          highlight
          icon={<ArrowDownToLine size="1em" strokeWidth={1.75} />}
        />
        <StatCard
          label={t("pending")}
          value={format(s.pendingInEscrow.value)}
          trendLabel={t("nLeads", { count: s.pendingInEscrow.count })}
          icon={<Hourglass size="1em" strokeWidth={1.75} />}
        />
      </div>

      {/* Operational row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[1em]">
        <StatCard
          label={t("clicks")}
          value={formatNumber(s.clicks.value)}
          trend={s.clicks.delta30d}
          trendLabel={t("vsPrev30d")}
          icon={<MousePointerClick size="1em" strokeWidth={1.75} />}
        />
        <StatCard
          label={t("conversions")}
          value={formatNumber(s.conversions.value)}
          trend={s.conversions.delta30d}
          trendLabel={t("vsPrev30d")}
          icon={<CheckCircle2 size="1em" strokeWidth={1.75} />}
        />
        <StatCard
          label={t("conversionRate")}
          value={`${s.conversionRate.value}%`}
          icon={<Percent size="1em" strokeWidth={1.75} />}
        />
        <StatCard
          label={t("avgPerConversion")}
          value={format(s.avgPerConversion.value)}
          icon={<Coins size="1em" strokeWidth={1.75} />}
        />
      </div>

      {/* Withdraw CTA — accent-colored so it stands out against the cream
          KPI band. Renders only when there's money to withdraw and banking
          is set up. Sized larger than the inline tile actions and given a
          shadow so it reads as the page's primary action when relevant. */}
      {s.availableToWithdraw.value > 0 && s.availableToWithdraw.hasBanking && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onWithdrawClick}
            className={cn(
              "group inline-flex items-center gap-[0.5em] h-[2.5em] px-[1.125em] rounded-[0.5em]",
              "text-[0.8125em] font-semibold tracking-[-0.005em]",
              "bg-accent text-cta-text shadow-sm",
              "hover:bg-accent-hover hover:shadow-md hover:-translate-y-[1px]",
              "active:translate-y-0",
              "transition-[background-color,box-shadow,transform] duration-150 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
            )}
          >
            <ArrowDownToLine
              size="0.9375em"
              strokeWidth={2.25}
              className="transition-transform duration-150 ease-out group-hover:translate-y-[1px]"
            />
            {t("withdraw")}
          </button>
        </div>
      )}
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="flex flex-col gap-[1em]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1em]">
        {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[1em]">
        {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-surface border border-border-light rounded-[0.625em] p-[1.375em] flex flex-col gap-[0.875em] shadow-xs">
      <div className="h-[0.75em] w-[40%] rounded-[0.25em] bg-bg-alt" />
      <div className="h-[1.75em] w-[60%] rounded-[0.25em] bg-bg-alt" />
      <div className="h-px bg-border-light" />
      <div className="h-[0.625em] w-[35%] rounded-[0.25em] bg-bg-alt" />
    </div>
  );
}
