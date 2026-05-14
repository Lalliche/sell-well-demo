"use client";

/**
 * PartnerLinksPage — partner-side `/partner-links` view.
 *
 * Mirrors the /leads pattern: aggregate KPI strip + tabs + table +
 * row-click DetailOverlay. The 3-tab segmentation collapses the
 * partner's links into Active / No activity / Paused buckets via
 * `partner-links-page/classify-tab.js`.
 *
 * Composition lives in `partner-links-page/`:
 *   - KpiStrip.jsx                    → 4-up totals card (Stripe pattern)
 *   - GenerateLinkPanel.jsx           → eligible-campaigns dropdown + CTA
 *   - PartnerLinksEmptyState.jsx      → per-tab empty content
 *   - partner-links-table-columns.jsx → DataTable column factory
 *   - cells.jsx                       → Campaign / Link / Performance cells
 *   - classify-tab.js                 → status → tab bucket
 *
 * Mock contract: `fetchPartnerLinks({ userId, search? })` returns rows
 * enriched with the nested campaign + company slice + a 30-day
 * `click_buckets` array (for inline Sparkline trends).
 * `fetchEligibleCampaignsForLinks({ userId })` powers the generate panel
 * (one-link-per-(partner, campaign) is enforced in the mock).
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  fetchPartnerLinks,
  fetchEligibleCampaignsForLinks,
  fetchPartnerLinkSales,
} from "@/lib/mock/partner-links";
import PageHeader from "@/components/shared/layout/PageHeader";
import DataTable from "@/components/shared/data-display/DataTable";
import StatusTabs from "@/components/shared/data-display/StatusTabs";
import SearchInput from "@/components/shared/layout/SearchInput";
import { FiInbox, FiActivity, FiZap, FiPauseCircle } from "react-icons/fi";
import KpiStrip from "./partner-links-page/KpiStrip";
import GenerateLinkPanel from "./partner-links-page/GenerateLinkPanel";
import PartnerLinksEmptyState from "./partner-links-page/PartnerLinksEmptyState";
import { buildPartnerLinksColumns } from "./partner-links-page/partner-links-table-columns";
import { classifyTab } from "./partner-links-page/classify-tab";
import PartnerLinkDetailOverlay from "./PartnerLinkDetailOverlay";

const TAB_KEYS = ["all", "active", "noActivity", "paused"];
const TAB_ICONS = {
  all: FiInbox,
  active: FiActivity,
  noActivity: FiZap,
  paused: FiPauseCircle,
};

export default function PartnerLinksPage() {
  const t = useTranslations("PartnerLinks");
  const tTable = useTranslations("PartnerLinks.table");
  const tCopy = useTranslations("PartnerLinks.copy");
  const { user } = useAuth();
  const userId = user?.id;

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [openRow, setOpenRow] = useState(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["partner-links", { userId, search }],
    queryFn: () => fetchPartnerLinks({ userId, search }),
    enabled: !!userId,
  });
  const { data: eligibleCampaigns = [] } = useQuery({
    queryKey: ["partner-links-eligible", { userId }],
    queryFn: () => fetchEligibleCampaignsForLinks({ userId }),
    enabled: !!userId,
  });
  // Sales aggregate powers the KPI strip's "commission earned" tile
  // (sums commission across every sale on every link this partner owns).
  const { data: allSales = [] } = useQuery({
    queryKey: ["partner-link-sales", { userId }],
    queryFn: () => fetchPartnerLinkSales({ userId }),
    enabled: !!userId,
  });
  const totalCommission = useMemo(
    () => allSales.reduce((m, s) => m + (s.commission_amount ?? 0), 0),
    [allSales],
  );

  const { classified, counts } = useMemo(() => {
    const c = { all: rows.length, active: 0, noActivity: 0, paused: 0 };
    const byRow = new Map();
    for (const r of rows) {
      const tab = classifyTab(r);
      byRow.set(r.id, tab);
      c[tab] = (c[tab] ?? 0) + 1;
    }
    return { classified: byRow, counts: c };
  }, [rows]);

  const visibleRows = useMemo(() => {
    if (activeTab === "all") return rows;
    return rows.filter((r) => classified.get(r.id) === activeTab);
  }, [rows, classified, activeTab]);

  const columns = useMemo(
    () => buildPartnerLinksColumns({
      tTable,
      copyLabels: {
        copy: tCopy("copy"),
        copied: tCopy("copied"),
        toastSuccess: tCopy("toastSuccess"),
      },
    }),
    [tTable, tCopy],
  );

  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[1.5em]">
      <PageHeader title={t("title")} description={t("description")} />

      <KpiStrip rows={rows} totalCommission={totalCommission} t={t} />

      <GenerateLinkPanel
        eligibleCampaigns={eligibleCampaigns}
        userId={userId}
        t={t}
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-[1em]">
        <StatusTabs
          tabs={TAB_KEYS.map((key) => ({
            key,
            label: t(`tabs.${key}`),
            icon: TAB_ICONS[key],
          }))}
          activeKey={activeTab}
          onChange={setActiveTab}
          counts={counts}
        />
        <SearchInput value={search} onChange={setSearch} placeholder={t("searchPlaceholder")} />
      </div>

      {visibleRows.length === 0 && !isLoading ? (
        <div className="bg-surface border border-border-light rounded-[0.625em] shadow-xs">
          <PartnerLinksEmptyState tab={activeTab} t={t} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={visibleRows}
          isLoading={isLoading}
          onRowClick={setOpenRow}
          pageSize={10}
        />
      )}

      <PartnerLinkDetailOverlay
        open={!!openRow}
        onClose={() => setOpenRow(null)}
        link={openRow}
      />
    </div>
  );
}
