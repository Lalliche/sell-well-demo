"use client";

/**
 * CompanyDashboard — composition of the Tech Company overview page.
 *
 * Layout (researched against Stripe Connect / Mercury / Linear / Airbnb host):
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ PageHeader (greeting + description)                          │
 *   │ ┌─CompanyKpiBand──────────────────────────────────────────┐ │
 *   │ │ Commissions paid · This month · Active partners · Leads  │ │
 *   │ └──────────────────────────────────────────────────────────┘ │
 *   │ ┌─CompanyCommissionChart (full width, slim)──────────────────│ │
 *   │ │ hero area chart + 7d/30d/90d/12m range toggle              │ │
 *   │ └────────────────────────────────────────────────────────────┘ │
 *   │ ┌─LeadsInboxPreview (2/3)─────┐ ┌─EscrowSummaryCard (1/3)───┐ │
 *   │ │ filter chips · 5 newest      │ │ available + bar +         │ │
 *   │ │ Reserve & View routes →      │ │ Fund / Withdraw           │ │
 *   │ └─────────────────────────────┘ └───────────────────────────┘ │
 *   │ ┌─ApplicationsQueue (2/3)─────┐ ┌─ActiveCampaignsList (1/3)─┐ │
 *   │ │ pending-first FIFO          │ │ status + partners + leads │ │
 *   │ └─────────────────────────────┘ └───────────────────────────┘ │
 *   │ ┌─PartnerLinkPerformance (full width)───────────────────────┐ │
 *   │ │ per-campaign rollup table OR empty state                  │ │
 *   │ └────────────────────────────────────────────────────────────┘ │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * State this component owns:
 *   - chart range (7d/30d/90d/12m) — passed down + used as a query key part.
 *
 * Each section is its own component so this file stays composition-only
 * (the partner side made the same call — see PartnerDashboard.jsx).
 *
 * `companyId` resolves from the AuthProvider's current user. CompanyProfile.id
 * lives on `user.profile.id` — distinct from `user.id` (the User row id).
 * The partner side doesn't have this distinction because the seed maps
 * Partner.user 1:1 to User.id, but companies have a real profile id.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/AuthProvider";
import PageHeader from "@/components/shared/layout/PageHeader";
import CompanyKpiBand from "./CompanyKpiBand";
import CompanyCommissionChart from "./CompanyCommissionChart";
import LeadsInboxPreview from "./LeadsInboxPreview";
import EscrowSummaryCard from "./EscrowSummaryCard";
import ApplicationsQueue from "./ApplicationsQueue";
import ActiveCampaignsList from "./ActiveCampaignsList";
import PartnerLinkPerformanceTable from "@/components/shared/data-display/PartnerLinkPerformanceTable";
import {
  fetchCompanyStats,
  fetchCompanyCommissionTimeseries,
  fetchCompanyPartnerLinksPerformance,
} from "@/lib/mock/company-stats";
import { fetchLeads } from "@/lib/mock/leads";
import { fetchCampaigns, fetchCompanyApplications } from "@/lib/mock/campaigns";
import { fetchWallet } from "@/lib/mock/escrow";

export default function CompanyDashboard() {
  const t = useTranslations("Dashboard.CompanyDashboard");
  const tPartnerLinks = useTranslations("Dashboard.CompanyDashboard.partnerLinks");
  const { user } = useAuth();
  const companyId = user?.profile?.id ?? user?.id;

  const [range, setRange] = useState("30d");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["company-stats", companyId],
    queryFn: () => fetchCompanyStats({ companyId }),
    enabled: !!companyId,
  });

  const { data: timeseries, isLoading: chartLoading } = useQuery({
    queryKey: ["company-commission-timeseries", companyId, range],
    queryFn: () => fetchCompanyCommissionTimeseries({ companyId, range }),
    enabled: !!companyId,
  });

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ["company-leads", companyId],
    queryFn: () => fetchLeads({ companyId }),
    enabled: !!companyId,
  });

  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ["company-applications", companyId],
    queryFn: () => fetchCompanyApplications({ companyId }),
    enabled: !!companyId,
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["company-campaigns", companyId],
    queryFn: () => fetchCampaigns({ companyId }),
    enabled: !!companyId,
  });

  const { data: wallet } = useQuery({
    queryKey: ["company-wallet", companyId],
    queryFn: () => fetchWallet({ companyId }),
    enabled: !!companyId,
  });

  const { data: linksPerf, isLoading: linksLoading } = useQuery({
    queryKey: ["company-partner-links-perf", companyId],
    queryFn: () => fetchCompanyPartnerLinksPerformance({ companyId }),
    enabled: !!companyId,
  });

  const greeting = user?.profile?.company_name ?? "";

  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[1.5em]">
      <PageHeader
        title={t("greeting", { name: greeting })}
        description={t("description")}
      />

      <CompanyKpiBand stats={stats} isLoading={statsLoading} />

      <CompanyCommissionChart
        data={timeseries}
        range={range}
        onRangeChange={setRange}
        isLoading={chartLoading}
      />

      {/* Hero zone — leads inbox (left, wide) + escrow (right, narrow).
          `items-stretch` (CSS Grid default) makes both children share the
          row height; each child uses `h-full` to actually fill the cell. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[1em]">
        <div className="lg:col-span-2 flex">
          <LeadsInboxPreview leads={leads} isLoading={leadsLoading} />
        </div>
        <div className="lg:col-span-1 flex">
          <EscrowSummaryCard wallet={wallet} />
        </div>
      </div>

      {/* Secondary zone — applications queue (left, wide) + active
          campaigns (right, narrow). Same row-height trick as above. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[1em]">
        <div className="lg:col-span-2 flex">
          <ApplicationsQueue applications={applications ?? []} isLoading={!applications && appsLoading} />
        </div>
        <div className="lg:col-span-1 flex">
          <ActiveCampaignsList
            campaigns={campaigns ?? []}
            leads={leads ?? []}
            applications={applications ?? []}
            isLoading={!campaigns && campaignsLoading}
          />
        </div>
      </div>

      <PartnerLinkPerformanceTable
        rows={linksPerf}
        isLoading={linksLoading}
        t={tPartnerLinks}
      />
    </div>
  );
}
