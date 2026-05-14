"use client";

/**
 * PartnerDashboard — composition of the Sales Partner overview page.
 *
 * Layout (12-col grid pattern from the research findings):
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ PageHeader (greeting + description)                         │
 *   │ ┌─KpiBand──────────────────────────────────────────────────┐│
 *   │ │ 4 money tiles  +  4 funnel tiles                          │
 *   │ └──────────────────────────────────────────────────────────┘│
 *   │ ┌─CommissionChart (2/3)─────┐ ┌─ActionRequiredStack (1/3)─┐ │
 *   │ │  hero area chart + range  │ │ time-pressure todos       │ │
 *   │ └───────────────────────────┘ └───────────────────────────┘ │
 *   │ ┌─RecentLeadsTable (2/3)────┐ ┌─ApprovedCampaignsList(1/3)┐ │
 *   │ │  status-grouped + filter  │ │ partner's approved deals  │ │
 *   │ │  chips                    │ │ + Submit/Generate quick   │ │
 *   │ │                           │ │ actions                   │ │
 *   │ └───────────────────────────┘ └───────────────────────────┘ │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * State this component owns:
 *   - chart range (7d/30d/90d/12m) — passed down to CommissionChart and
 *     used as a query key part for the timeseries fetch.
 *
 * Each section is its own component so this file stays composition-only.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import PageHeader from "@/components/shared/layout/PageHeader";
import KpiBand from "./KpiBand";
import CommissionChart from "./CommissionChart";
import ActionRequiredStack from "./ActionRequiredStack";
import RecentLeadsTable from "./RecentLeadsTable";
import ApprovedCampaignsList from "./ApprovedCampaignsList";
import {
  fetchPartnerStats,
  fetchPartnerActions,
  fetchPartnerCommissionTimeseries,
} from "@/lib/mock/partner-stats";
import { fetchLeads } from "@/lib/mock/leads";
import { fetchCampaigns } from "@/lib/mock/campaigns";

// Approved-campaigns list paired with the recent-leads table — same
// vertical room, no internal limit (we let the right column fill the row
// height naturally; if it has more rows than fit, it'll scroll).

export default function PartnerDashboard() {
  const t = useTranslations("Dashboard.PartnerDashboard");
  const { user } = useAuth();
  const router = useRouter();
  const userId = user?.id;

  const [range, setRange] = useState("30d");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["partner-stats", userId],
    queryFn: () => fetchPartnerStats({ userId }),
    enabled: !!userId,
  });

  const { data: actions, isLoading: actionsLoading } = useQuery({
    queryKey: ["partner-actions", userId],
    queryFn: () => fetchPartnerActions({ userId }),
    enabled: !!userId,
  });

  const { data: timeseries, isLoading: chartLoading } = useQuery({
    queryKey: ["partner-commission-timeseries", userId, range],
    queryFn: () => fetchPartnerCommissionTimeseries({ userId, range }),
    enabled: !!userId,
  });

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ["partner-leads", userId],
    queryFn: () => fetchLeads({ userId }),
    enabled: !!userId,
  });

  const { data: approvedCampaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["partner-approved-campaigns", userId],
    queryFn: () => fetchCampaigns({ approvedFor: userId }),
    enabled: !!userId,
  });

  const greeting = user?.profile
    ? `${user.profile.first_name} ${user.profile.last_name}`
    : "";

  function handleWithdraw() {
    router.push("/earnings");
  }

  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[1.5em]">
      <PageHeader
        title={t("greeting", { name: greeting })}
        description={t("description")}
      />

      <KpiBand stats={stats} isLoading={statsLoading} onWithdrawClick={handleWithdraw} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[1em]">
        <div className="lg:col-span-2">
          <CommissionChart
            data={timeseries}
            range={range}
            onRangeChange={setRange}
            isLoading={chartLoading}
          />
        </div>
        <div className="lg:col-span-1">
          <ActionRequiredStack actions={actions} isLoading={actionsLoading} />
        </div>
      </div>

      {/* Activity zone — `items-stretch` (CSS Grid default) makes both
          children share the row's height, so the right card's bottom
          edge lines up with the leads table's bottom edge. Each card
          uses `h-full` to actually fill that grid cell. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[1em]">
        <div className="lg:col-span-2 flex">
          <RecentLeadsTable leads={leads} isLoading={leadsLoading} />
        </div>
        <div className="lg:col-span-1 flex">
          <ApprovedCampaignsList
            campaigns={approvedCampaigns}
            isLoading={campaignsLoading}
          />
        </div>
      </div>
    </div>
  );
}
