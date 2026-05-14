"use client";

/**
 * AdminCampaignsPage — admin /admin/campaigns route.
 *
 * Pattern mirrors AdminUsersPage:
 *   PageHeader · FilterBar (search + filters trigger) · StatusTabs ·
 *   FilterPanel (Category single-select) · DataTable
 *
 * Server-side filters thread through React Query queryKey + `fetchAllCampaigns`
 * signature (CLAUDE.md §3). Row click opens `AdminCampaignDetailOverlay` —
 * admin never navigates to /marketplace/[slug]; the overlay reuses the
 * partner-facing campaign-detail building blocks wrapped for admin and owns
 * its own action footer (force-pause/resume/close + feature/unfeature). The
 * table itself is read-only — no row-level kebab.
 */

import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { Megaphone, CheckCircle2, PauseCircle, FileEdit, XCircle } from "lucide-react";

import PageHeader from "@/components/shared/layout/PageHeader";
import FilterBar from "@/components/shared/layout/FilterBar";
import FilterPanel from "@/components/shared/overlays/FilterPanel";
import StatusTabs from "@/components/shared/data-display/StatusTabs";
import DataTable from "@/components/shared/data-display/DataTable";
import { fetchAllCampaigns } from "@/lib/mock/admin";
import { MOCK_CATEGORIES } from "@/lib/mock/_seed/categories";
import AdminCampaignDetailOverlay from "./AdminCampaignDetailOverlay";
import { buildAdminCampaignsColumns } from "./admin-campaigns-columns";

export default function AdminCampaignsPage() {
  const t = useTranslations("Admin.campaigns");
  const locale = useLocale();

  const [activeTab, setActiveTab] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [openOverlayId, setOpenOverlayId] = useState(null);
  const filterTriggerRef = useRef(null);

  const status = activeTab === "all" ? undefined : activeTab;

  const { data: rows = [], isLoading } = useQuery({
    queryKey: [
      "admin", "campaigns",
      {
        status: status ?? null,
        category: categoryFilter,
        search: search.trim(),
      },
    ],
    queryFn: () =>
      fetchAllCampaigns({
        status,
        category: categoryFilter ?? undefined,
        search: search.trim() || undefined,
      }),
  });

  /* ── Tabs ────────────────────────────────────────────────────────── */
  const tabs = useMemo(
    () => [
      { key: "all",    label: t("tabs.all"),    icon: Megaphone },
      { key: "active", label: t("tabs.active"), icon: CheckCircle2 },
      { key: "paused", label: t("tabs.paused"), icon: PauseCircle },
      { key: "draft",  label: t("tabs.draft"),  icon: FileEdit },
      { key: "closed", label: t("tabs.closed"), icon: XCircle },
    ],
    [t],
  );

  /* ── FilterPanel sections ───────────────────────────────────────── */
  const filterSections = useMemo(
    () => [
      {
        key: "category",
        label: t("filters.categoryLabel"),
        type: "chips",
        options: MOCK_CATEGORIES.filter((c) => c.is_active !== false).map((c) => ({
          value: c.id,
          label: locale === "fr" ? c.name_fr : c.name_en,
        })),
      },
    ],
    [t, locale],
  );

  const handlePanelApply = (next) => {
    if (Array.isArray(next.category)) {
      setCategoryFilter(next.category.length === 1 ? next.category[0] : null);
    }
  };
  const handlePanelReset = () => setCategoryFilter(null);
  const activeFilterCount = categoryFilter !== null ? 1 : 0;

  const columns = useMemo(
    () => buildAdminCampaignsColumns({ t, locale }),
    [t, locale],
  );

  const emptyKey = ["all", "active", "paused", "draft", "closed"].includes(activeTab)
    ? activeTab
    : "all";

  return (
    <div className="flex flex-col gap-[1.5em] px-[2em] py-[2em]">
      <PageHeader title={t("title")} description={t("description")} />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("filters.searchPlaceholder")}
        onFilterClick={() => setPanelOpen((v) => !v)}
        activeFilterCount={activeFilterCount}
        filterTriggerRef={filterTriggerRef}
      />

      <StatusTabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />

      <FilterPanel
        triggerRef={filterTriggerRef}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onApply={handlePanelApply}
        onReset={handlePanelReset}
        sections={filterSections}
        activeCount={activeFilterCount}
        initialValues={{
          category: categoryFilter !== null ? [categoryFilter] : [],
        }}
      />

      <div className="max-w-[82em]">
        <DataTable
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          emptyTitle={t(`empty.${emptyKey}.title`)}
          emptySubtitle={t(`empty.${emptyKey}.body`)}
          onRowClick={(row) => setOpenOverlayId(row.id)}
          pageSize={10}
        />
      </div>

      <AdminCampaignDetailOverlay
        campaignId={openOverlayId}
        open={openOverlayId !== null}
        onClose={() => setOpenOverlayId(null)}
      />
    </div>
  );
}
