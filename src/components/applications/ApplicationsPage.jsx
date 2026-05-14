"use client";

/**
 * ApplicationsPage — partner-side /applications view.
 *
 * Tabbed table + click-row → DetailOverlay (per the 6.4 UX research).
 * Composition lives in `applications-page/`:
 *   - applications-table-columns.jsx → DataTable column factory
 *   - CampaignCell.jsx               → company-logo + product cell
 *   - ApplicationsEmptyState.jsx     → per-tab empty content
 *
 * Mock contract — `fetchPartnerApplications({ userId, search? })` returns
 * rows enriched with the nested campaign + company slice. Backend mirror:
 * `GET /api/applications/`, partner identity from session.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { Link as IntlLink } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchPartnerApplications } from "@/lib/mock/campaigns";
import PageHeader from "@/components/shared/layout/PageHeader";
import DataTable from "@/components/shared/data-display/DataTable";
import StatusTabs from "@/components/shared/data-display/StatusTabs";
import SearchInput from "@/components/shared/layout/SearchInput";
import AppButton from "@/components/ui/Buttons";
import { FiInbox, FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";
import ApplicationDetailOverlay from "./ApplicationDetailOverlay";
import ApplicationsEmptyState from "./applications-page/ApplicationsEmptyState";
import { buildApplicationsColumns } from "./applications-page/applications-table-columns";

const TAB_KEYS = ["all", "pending", "approved", "rejected"];
const TAB_ICONS = {
  all: FiInbox,
  pending: FiClock,
  approved: FiCheckCircle,
  rejected: FiXCircle,
};

export default function ApplicationsPage() {
  const t = useTranslations("Applications");
  const tTime = useTranslations("Applications.time");
  const tTable = useTranslations("Applications.table");
  const locale = useLocale();
  const { user } = useAuth();
  const userId = user?.id;

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [openRow, setOpenRow] = useState(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["applications", { userId, search }],
    queryFn: () => fetchPartnerApplications({ userId, search }),
    enabled: !!userId,
  });

  const counts = useMemo(() => {
    const c = { all: rows.length, pending: 0, approved: 0, rejected: 0 };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const visibleRows = useMemo(
    () => (activeTab === "all" ? rows : rows.filter((r) => r.status === activeTab)),
    [rows, activeTab],
  );

  const columns = useMemo(
    () => buildApplicationsColumns({ locale, tTable, tTime }),
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
      <PageHeader title={t("title")} description={t("description")} />

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
          <ApplicationsEmptyState tab={activeTab} t={t} />
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

      <ApplicationDetailOverlay
        open={!!openRow}
        onClose={() => setOpenRow(null)}
        application={openRow}
      />
    </div>
  );
}
