"use client";

/**
 * LeadsPage — partner-side /leads view.
 *
 * Mirrors the /applications pattern (tabs + table + row-click overlay).
 * The 9-status Lead enum is collapsed into 5 partner-meaningful tabs
 * (All · Active · Expiring soon · Awaiting · Closed). See
 * `leads-page/classify-tab.js` for the bucket logic.
 *
 * Composition lives in `leads-page/`:
 *   - leads-table-columns.jsx → DataTable column factory + cell renderers
 *   - cells.jsx               → Client + Campaign cell components
 *   - SearchInput.jsx         → controlled search field
 *   - LeadsEmptyState.jsx     → per-tab empty content
 *   - SubmitLeadButton.jsx    → primary CTA
 *   - classify-tab.js         → status → tab bucket
 *
 * Mock contract — `fetchPartnerLeads({ userId, search? })` returns
 * rows enriched with the nested campaign + company + pricing-tier slice.
 * Backend mirror: `GET /api/leads/`.
 */

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link as IntlLink } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchPartnerLeads } from "@/lib/mock/leads";
import PageHeader from "@/components/shared/layout/PageHeader";
import DataTable from "@/components/shared/data-display/DataTable";
import StatusTabs from "@/components/shared/data-display/StatusTabs";
import AppButton from "@/components/ui/Buttons";
import { FiInbox, FiActivity, FiAlertTriangle, FiClock, FiArchive, FiEdit3 } from "react-icons/fi";
import LeadDetailOverlay from "./LeadDetailOverlay";
import SearchInput from "@/components/shared/layout/SearchInput";
import LeadsEmptyState from "./leads-page/LeadsEmptyState";
import SubmitLeadButton from "./leads-page/SubmitLeadButton";
import { buildLeadsColumns } from "./leads-page/leads-table-columns";
import { classifyTab } from "./leads-page/classify-tab";

const TAB_KEYS = ["all", "draft", "active", "expiringSoon", "awaiting", "closed"];
const TAB_ICONS = {
  all: FiInbox,
  draft: FiEdit3,
  active: FiActivity,
  expiringSoon: FiAlertTriangle,
  awaiting: FiClock,
  closed: FiArchive,
};

export default function LeadsPage() {
  const t = useTranslations("Leads");
  const tTime = useTranslations("Leads.time");
  const tTable = useTranslations("Leads.table");
  const locale = useLocale();
  const { user } = useAuth();
  const userId = user?.id;

  const searchParams = useSearchParams();
  const initialTab = TAB_KEYS.includes(searchParams.get("tab"))
    ? searchParams.get("tab")
    : "all";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [search, setSearch] = useState("");
  const [openRow, setOpenRow] = useState(null);

  // `now` captured via effect — Date.now() is impure, so we read it once
  // per render cycle outside render and let derivations consume it.
  const [now, setNow] = useState(null);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setNow(Date.now()));
    return () => cancelAnimationFrame(raf);
  }, []);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["partner-leads", { userId, search }],
    queryFn: () => fetchPartnerLeads({ userId, search }),
    enabled: !!userId,
  });

  const { classified, counts } = useMemo(() => {
    const c = { all: rows.length, draft: 0, active: 0, expiringSoon: 0, awaiting: 0, closed: 0 };
    const byRow = new Map();
    if (now === null) return { classified: byRow, counts: c };
    for (const r of rows) {
      const tab = classifyTab(r, now);
      byRow.set(r.id, tab);
      c[tab] = (c[tab] ?? 0) + 1;
    }
    return { classified: byRow, counts: c };
  }, [rows, now]);

  const visibleRows = useMemo(() => {
    if (activeTab === "all") return rows;
    return rows.filter((r) => classified.get(r.id) === activeTab);
  }, [rows, classified, activeTab]);

  const columns = useMemo(
    () => buildLeadsColumns({ locale, tTable, tTime }),
    [locale, tTable, tTime],
  );

  const renderActions = (row) => (
    <div onClick={(e) => e.stopPropagation()}>
      <IntlLink href={`/marketplace/${row.campaign.slug}`}>
        <AppButton size="sm" variant="secondary">{tTable("viewCampaign")}</AppButton>
      </IntlLink>
    </div>
  );

  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[1.5em]">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={<SubmitLeadButton label={t("submitCta")} />}
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
          <LeadsEmptyState tab={activeTab} t={t} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={visibleRows}
          isLoading={isLoading}
          actions={renderActions}
          actionsWidth="11em"
          onRowClick={setOpenRow}
          pageSize={10}
        />
      )}

      <LeadDetailOverlay open={!!openRow} onClose={() => setOpenRow(null)} lead={openRow} />
    </div>
  );
}
