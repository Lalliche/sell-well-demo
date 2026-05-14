"use client";

/**
 * CompanyPartnerLinksPerformancePage — `/partner-links/performance`
 * (Phase 7.11). Company-side rollup of every partner-link campaign the
 * company has enabled.
 *
 * Layout (top → bottom):
 *   1. PageHeader
 *   2. Date-range tabs (Last 7 / 30 / 90 days · All time). Default 30d.
 *   3. KPI strip — Clicks · Conversions · Revenue · Commissions paid
 *      (all aggregated across the table rows currently in scope).
 *   4. Shared `PartnerLinkPerformanceTable` (the same component the
 *      company dashboard uses as its preview rollup).
 *
 * Date-range honesty note: the mock seed has per-sale timestamps but
 * no per-day click data, so when a window is applied the table shows
 * windowed `revenue` / `conversions` / `commissions_paid` against an
 * all-time `clicks` count. We hide `clicks` + `conversion_rate` from
 * the KPI strip on windowed views to avoid mixing time scales. The
 * table column still renders clicks but tagged with a tooltip in the
 * column header.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  MousePointerClick,
  Target,
  Percent,
  Coins,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchCompanyPartnerLinksPerformance } from "@/lib/mock/company-stats";
import PageHeader from "@/components/shared/layout/PageHeader";
import StatusTabs from "@/components/shared/data-display/StatusTabs";
import StatCard from "@/components/shared/analytics/StatCard";
import PartnerLinkPerformanceTable from "@/components/shared/data-display/PartnerLinkPerformanceTable";
import { format as formatDZD, formatNumber } from "@/lib/format/currency";
import { rangeToISO } from "./company-perf-helpers";
import CampaignPartnerBreakdownOverlay from "./CampaignPartnerBreakdownOverlay";

const RANGE_KEYS = ["7d", "30d", "90d", "all"];
const DEFAULT_RANGE = "30d";

export default function CompanyPartnerLinksPerformancePage() {
  const t = useTranslations("PartnerLinksPerf");
  const tTable = useTranslations("Dashboard.CompanyDashboard.partnerLinks");
  const { user } = useAuth();
  const companyId = user?.role === "company" ? user.profile?.id : null;

  const [range, setRange] = useState(DEFAULT_RANGE);
  const [openCampaign, setOpenCampaign] = useState(null);
  const sinceISO = rangeToISO(range);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["company-partner-links-perf", companyId, range],
    queryFn: () =>
      fetchCompanyPartnerLinksPerformance({ companyId, sinceISO }),
    enabled: !!companyId,
  });

  const totals = useMemo(() => {
    const clicks = rows.reduce((m, r) => m + (r.clicks ?? 0), 0);
    const conversions = rows.reduce((m, r) => m + (r.conversions ?? 0), 0);
    const conversionRate = clicks
      ? Math.round((conversions / clicks) * 1000) / 10
      : 0;
    const commissionsPaid = rows.reduce(
      (m, r) => m + (r.commissions_paid ?? 0),
      0,
    );
    return { clicks, conversions, conversionRate, commissionsPaid };
  }, [rows]);

  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[1.5em]">
      <PageHeader title={t("title")} description={t("description")} />

      <StatusTabs
        tabs={RANGE_KEYS.map((key) => ({
          key,
          label: t(`range.${key}`),
        }))}
        activeKey={range}
        onChange={setRange}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1em]">
        <StatCard
          label={t("kpi.clicks")}
          value={formatNumber(totals.clicks)}
          icon={<MousePointerClick className="w-[1em] h-[1em]" strokeWidth={1.75} />}
        />
        <StatCard
          label={t("kpi.conversions")}
          value={formatNumber(totals.conversions)}
          icon={<Target className="w-[1em] h-[1em]" strokeWidth={1.75} />}
        />
        <StatCard
          label={t("kpi.conversionRate")}
          value={`${totals.conversionRate}%`}
          icon={<Percent className="w-[1em] h-[1em]" strokeWidth={1.75} />}
        />
        <StatCard
          label={t("kpi.commissionsPaid")}
          value={formatDZD(totals.commissionsPaid)}
          icon={<Coins className="w-[1em] h-[1em]" strokeWidth={1.75} />}
          highlight
        />
      </div>

      <PartnerLinkPerformanceTable
        rows={rows}
        isLoading={isLoading}
        t={tTable}
        showHeader={false}
        showViewAll={false}
        onRowClick={setOpenCampaign}
      />

      <CampaignPartnerBreakdownOverlay
        open={!!openCampaign}
        onClose={() => setOpenCampaign(null)}
        campaign={openCampaign}
        sinceISO={sinceISO}
      />
    </div>
  );
}
