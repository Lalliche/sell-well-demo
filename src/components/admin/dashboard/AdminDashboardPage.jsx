"use client";

/**
 * AdminDashboardPage — platform-wide ops control center for admin users.
 *
 * Layout (research-backed, ordered by what admin needs first → last):
 *
 *   PageHeader
 *
 *   ─ Needs your attention ──────────────────────────────────────────
 *     AttentionQueueCard × 3 (Verifications · Withdrawals · Disputes)
 *     Each card shows the top 3 rows of its queue inline — admin can
 *     triage without opening the full queue page. (Stripe Radar pattern.)
 *
 *   ─ Platform pulse (8 stat cards, in 2 rows of 4) ─────────────────
 *     Row 1 — Users · Signups (w/ sparkline) · Active Campaigns · Open Disputes
 *     Row 2 — Revenue this month (highlight) · Revenue all-time · Commissions · Escrow held
 *
 *   ─ Lead funnel (full width) ──────────────────────────────────────
 *     ConversionFunnelCard with submitted → acknowledged → converted → disputed
 *
 *   ─ Platform leaders ──────────────────────────────────────────────
 *     LeaderboardCard × 3 (Top campaigns · Top partners · Top companies)
 *     Each row: rank + avatar + name + 30-day sparkline + value + delta pill.
 *     (Mercury / Ramp dense leaderboard pattern.)
 *
 * Authority constraint: no click-through to individual leads from anywhere
 * on this page. Lead funnel is read-only aggregates; leaderboards link to
 * campaign / company detail pages, not lead rows.
 *
 * Premium polish:
 *   - Question-style titles on stat cards ("How is the platform earning?")
 *   - Browser tab counter — "(3) SellWell Admin" when disputes are open.
 *   - max-w-[82em] on every row so cards don't stretch on ultra-wide.
 */

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Users,
  TrendingUp,
  LayoutGrid,
  AlertTriangle,
  UserCheck,
  Banknote,
  Scale,
} from "lucide-react";
import { FiSend, FiEye, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

import PageHeader from "@/components/shared/layout/PageHeader";
import StatCard from "@/components/shared/analytics/StatCard";
import StatCardBreakdown from "@/components/shared/analytics/StatCardBreakdown";
import ConversionFunnelCard from "@/components/shared/analytics/ConversionFunnelCard";
import StatusBadge from "@/components/shared/data-display/StatusBadge";
import AttentionQueueCard from "./AttentionQueueCard";
import LeaderboardCard from "./LeaderboardCard";
import { fetchAdminDashboardStats } from "@/lib/mock/admin";
import { format, formatCompact, formatNumber } from "@/lib/format/currency";

/* Standard responsive grid for the 4-card stat rows.
 *   xl+ → 4 columns
 *   md  → 3 columns
 *   sm  → 2 columns
 *   <sm → 1 column                                                       */
const STAT_GRID = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-[1em] max-w-[82em]";

/* Trio grid for sections that ship 3 cards (attention queues, leaderboards).
 *   xl+ → 3 columns
 *   md  → 3 columns (still 3 — these are mini-tables, they tighten gracefully)
 *   sm  → 2 columns
 *   <sm → 1 column                                                       */
const TRIO_GRID = "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-[1em] max-w-[82em]";

export default function AdminDashboardPage() {
  const t = useTranslations("Admin.dashboard");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: fetchAdminDashboardStats,
  });

  // Browser tab counter — surfaces the total queue load right in the tab
  // title so an admin who lives in this tab all day spots new urgent work
  // without switching tabs. Pattern from Vercel's dashboard.
  useEffect(() => {
    if (!stats) return;
    const total =
      (stats.queues?.verifications_pending ?? 0) +
      (stats.queues?.withdrawals_pending ?? 0) +
      (stats.queues?.disputes_open ?? 0);
    const base = "SellWell Admin";
    const prev = document.title;
    document.title = total > 0 ? `(${total}) ${base}` : base;
    return () => { document.title = prev; };
  }, [stats]);

  if (isLoading) return <AdminDashboardSkeleton />;

  const funnelStages = [
    { label: t("funnel.submitted"),    count: stats.leads.submitted,    icon: <FiSend key="send" size="1em" strokeWidth={1.5} /> },
    { label: t("funnel.acknowledged"), count: stats.leads.acknowledged, icon: <FiEye key="eye" size="1em" strokeWidth={1.5} /> },
    { label: t("funnel.converted"),    count: stats.leads.converted,    icon: <FiCheckCircle key="check" size="1em" strokeWidth={1.5} /> },
    { label: t("funnel.disputed"),     count: stats.leads.disputed,     icon: <FiAlertCircle key="alert" size="1em" strokeWidth={1.5} /> },
  ];

  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[2em]">
      <PageHeader title={t("title")} description={t("description")} />

      {/* ── Needs your attention ─────────────────────────────────────── */}
      <SectionHeader
        eyebrow={t("attention.eyebrow")}
        title={t("attention.title")}
      />
      <div className={TRIO_GRID}>
        <AttentionQueueCard
          title={t("attention.verifications.title")}
          icon={<UserCheck size="1em" strokeWidth={1.5} />}
          totalCount={stats.queues.verifications_pending}
          rows={stats.attention.verifications.map((v) => ({
            key: `v-${v.id}`,
            primary: v.display_name,
            secondary: v.role === "sales_partner"
              ? t("attention.verifications.subPartner")
              : t("attention.verifications.subCompany"),
            days_waiting: v.days_waiting,
            href: `/admin/verifications`,
          }))}
          seeAllHref="/admin/verifications"
          seeAllLabel={t("attention.seeAll", { count: stats.queues.verifications_pending })}
          emptyLabel={t("attention.verifications.empty")}
        />

        <AttentionQueueCard
          title={t("attention.withdrawals.title")}
          icon={<Banknote size="1em" strokeWidth={1.5} />}
          totalCount={stats.queues.withdrawals_pending}
          rows={stats.attention.withdrawals.map((w) => ({
            key: `w-${w.id}`,
            primary: w.display_name,
            secondary: `${format(w.amount)} · ${w.payout_method.toUpperCase()}`,
            days_waiting: w.days_waiting,
            href: `/admin/withdrawals`,
          }))}
          seeAllHref="/admin/withdrawals"
          seeAllLabel={t("attention.seeAll", { count: stats.queues.withdrawals_pending })}
          emptyLabel={t("attention.withdrawals.empty")}
        />

        <AttentionQueueCard
          title={t("attention.disputes.title")}
          icon={<Scale size="1em" strokeWidth={1.5} />}
          totalCount={stats.queues.disputes_open}
          rows={stats.attention.disputes.map((d) => ({
            key: `d-${d.id}`,
            primary: d.client_full_name,
            secondary: `${d.campaign_name ?? "—"} · ${d.partner_name ?? "—"}`,
            days_waiting: d.days_waiting,
            href: `/admin/disputes/${d.slug}`,
            badge: <StatusBadge status={d.status} className="text-[0.6875em] px-[0.4375em] py-[0.1875em]" />,
          }))}
          seeAllHref="/admin/disputes"
          seeAllLabel={t("attention.seeAll", { count: stats.queues.disputes_open })}
          emptyLabel={t("attention.disputes.empty")}
        />
      </div>

      {/* ── Platform pulse — Row 1 ───────────────────────────────────── */}
      <SectionHeader
        eyebrow={t("pulse.eyebrow")}
        title={t("pulse.title")}
      />
      <div className={STAT_GRID}>
        <StatCardBreakdown
          label={t("cards.users.label")}
          value={formatNumber(stats.users.total)}
          icon={<Users size="1em" strokeWidth={1.5} />}
          items={[
            { label: t("cards.users.partners"),  value: formatNumber(stats.users.partners) },
            { label: t("cards.users.companies"), value: formatNumber(stats.users.companies) },
          ]}
        />
        <StatCard
          label={t("cards.signups.label")}
          value={formatNumber(stats.signups.week)}
          trend={stats.signups.trend}
          trendLabel={t("cards.signups.trendLabel")}
          sparkline={stats.signups.sparkline}
          icon={<TrendingUp size="1em" strokeWidth={1.5} />}
        />
        <StatCard
          label={t("cards.campaigns.label")}
          value={formatNumber(stats.campaigns_active)}
          icon={<LayoutGrid size="1em" strokeWidth={1.5} />}
        />
        <StatCard
          label={t("cards.disputes.label")}
          value={formatNumber(stats.disputes_open)}
          icon={<AlertTriangle size="1em" strokeWidth={1.5} />}
        />
      </div>

      {/* ── Platform pulse — Row 2: money ────────────────────────────── */}
      <div className={STAT_GRID}>
        <StatCard
          label={t("cards.revenueMonth.label")}
          value={formatCompact(stats.revenue.month)}
          highlight
          className="border-t-2 border-t-accent"
        />
        <StatCard
          label={t("cards.revenueAllTime.label")}
          value={formatCompact(stats.revenue.all_time)}
        />
        <StatCard
          label={t("cards.commissions.label")}
          value={formatCompact(stats.commissions_facilitated)}
        />
        <StatCard
          label={t("cards.escrow.label")}
          value={formatCompact(stats.escrow_held)}
        />
      </div>

      {/* ── Lead funnel ──────────────────────────────────────────────── */}
      <div className="max-w-[82em]">
        <ConversionFunnelCard
          title={t("funnel.title")}
          stages={funnelStages}
        />
      </div>

      {/* ── Platform leaders ─────────────────────────────────────────── */}
      <SectionHeader
        eyebrow={t("leaders.eyebrow")}
        title={t("leaders.title")}
      />
      <div className={TRIO_GRID}>
        <LeaderboardCard
          title={t("leaders.campaigns.title")}
          eyebrow={t("leaders.thisMonth")}
          rows={stats.leaderboards.campaigns.map((c) => ({
            key: `lb-c-${c.id}`,
            avatar_name: c.company_name ?? c.product_name,
            primary: c.product_name,
            secondary: c.company_name ?? "",
            metric_value: t("leaders.campaigns.unit", { count: c.metric_value }),
            sparkline: c.sparkline,
            delta: c.delta,
          }))}
          emptyLabel={t("leaders.campaigns.empty")}
        />

        <LeaderboardCard
          title={t("leaders.partners.title")}
          eyebrow={t("leaders.thisMonth")}
          rows={stats.leaderboards.partners.map((p) => ({
            key: `lb-p-${p.id}`,
            avatar_name: p.display_name,
            primary: p.display_name,
            secondary: t("leaders.partners.role"),
            metric_value: formatCompact(p.metric_value),
            sparkline: p.sparkline,
            delta: p.delta,
          }))}
          emptyLabel={t("leaders.partners.empty")}
        />

        <LeaderboardCard
          title={t("leaders.companies.title")}
          eyebrow={t("leaders.allTime")}
          rows={stats.leaderboards.companies.map((c) => ({
            key: `lb-co-${c.id}`,
            avatar_name: c.company_name,
            primary: c.company_name,
            secondary: t("leaders.companies.role"),
            metric_value: formatCompact(c.metric_value),
            sparkline: c.sparkline,
            delta: c.delta,
          }))}
          emptyLabel={t("leaders.companies.empty")}
        />
      </div>
    </div>
  );
}

/* ── Section header ──────────────────────────────────────────────────── */

function SectionHeader({ eyebrow, title }) {
  return (
    <div className="flex flex-col gap-[0.125em] max-w-[82em]">
      <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
        {eyebrow}
      </span>
      <h2 className="font-heading font-semibold text-[1.125em] text-text">
        {title}
      </h2>
    </div>
  );
}

/* ── Loading skeleton ────────────────────────────────────────────────── */

function AdminDashboardSkeleton() {
  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[2em] animate-pulse">
      <div className="flex flex-col gap-[0.5em]">
        <div className="h-[2em] w-[14em] bg-border-light rounded-[0.5em]" />
        <div className="h-[1em] w-[28em] bg-border-light rounded-[0.5em]" />
      </div>

      {/* Attention skeleton */}
      <div className={TRIO_GRID}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-surface border border-border-light rounded-[0.625em] h-[12em]" />
        ))}
      </div>

      {/* Stat rows */}
      {[0, 1].map((row) => (
        <div key={row} className={STAT_GRID}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border-light rounded-[0.625em] p-[1.375em] h-[7em]" />
          ))}
        </div>
      ))}

      <div className="bg-surface border border-border-light rounded-[0.625em] p-[1.375em] h-[12em] max-w-[82em]" />

      <div className={TRIO_GRID}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-surface border border-border-light rounded-[0.625em] h-[14em]" />
        ))}
      </div>
    </div>
  );
}
