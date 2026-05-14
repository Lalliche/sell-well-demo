"use client";

/**
 * VerificationsPage — admin /admin/verifications route.
 *
 * Layout (matches the project-wide list-page pattern — see MarketplacePage,
 * /leads, /applications, /partner-links — for the shared FilterBar +
 * StatusTabs + FilterPanel composition):
 *
 *   PageHeader
 *   FilterBar  (search + Filters button → opens FilterPanel)
 *   StatusTabs (primary status: pending_review · more_info_requested · rejected)
 *   DataTable  (name, role, signup, days waiting, status)
 *     row click → VerificationDetailOverlay
 *
 *   FilterPanel sections:
 *     - Role (single-select coerced from chip multi-select, like Marketplace
 *       does for commission type)
 *
 * Authority: no leads here; standard admin-only route.
 * Sort: FIFO — oldest signup first (handled by the mock).
 *
 * Search, role, status all thread through the React Query `queryKey` and
 * into the mock fn — no client-side filtering of the result. See
 * client/CLAUDE.md §3 (server-side filters).
 */

import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { Clock, MessageSquare, XCircle, UserCheck, Building2 } from "lucide-react";

import PageHeader from "@/components/shared/layout/PageHeader";
import FilterBar from "@/components/shared/layout/FilterBar";
import FilterPanel from "@/components/shared/overlays/FilterPanel";
import StatusTabs from "@/components/shared/data-display/StatusTabs";
import StatusBadge from "@/components/shared/data-display/StatusBadge";
import Avatar from "@/components/shared/data-display/Avatar";
import DataTable from "@/components/shared/data-display/DataTable";
import { fetchVerifications } from "@/lib/mock/admin";
import VerificationDetailOverlay from "./VerificationDetailOverlay";

export default function VerificationsPage() {
  const t = useTranslations("Admin.verifications");
  const locale = useLocale();

  const [activeTab, setActiveTab] = useState("pending_review");
  const [roleFilter, setRoleFilter] = useState(null); // null | "sales_partner" | "company"
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const filterTriggerRef = useRef(null);

  // One query per (status, role, search). React Query caches each
  // combination independently so toggling filters and tabs feels instant
  // once a combination has been hydrated. All narrowing happens server-side
  // in `fetchVerifications` — never on the rows we get back here.
  const { data: rows = [], isLoading } = useQuery({
    queryKey: [
      "admin", "verifications",
      { status: activeTab, role: roleFilter, search: search.trim() },
    ],
    queryFn: () =>
      fetchVerifications({
        status: activeTab,
        role: roleFilter ?? undefined,
        search: search.trim() || undefined,
      }),
  });

  // Tab counts — fetched once for each status, ignoring the role + search
  // filters so the count chip always shows the global queue depth per
  // status.
  const { data: pendingAll = [] } = useQuery({
    queryKey: ["admin", "verifications", { status: "pending_review", role: null, search: "" }],
    queryFn: () => fetchVerifications({ status: "pending_review" }),
  });
  const { data: moreInfoAll = [] } = useQuery({
    queryKey: ["admin", "verifications", { status: "more_info_requested", role: null, search: "" }],
    queryFn: () => fetchVerifications({ status: "more_info_requested" }),
  });
  const { data: rejectedAll = [] } = useQuery({
    queryKey: ["admin", "verifications", { status: "rejected", role: null, search: "" }],
    queryFn: () => fetchVerifications({ status: "rejected" }),
  });

  const tabs = useMemo(
    () => [
      { key: "pending_review",       label: t("tabs.pending"),    icon: Clock },
      { key: "more_info_requested",  label: t("tabs.moreInfo"),   icon: MessageSquare },
      { key: "rejected",             label: t("tabs.rejected"),   icon: XCircle },
    ],
    [t],
  );

  const counts = {
    pending_review:       pendingAll.length,
    more_info_requested:  moreInfoAll.length,
    rejected:             rejectedAll.length,
  };

  /* ── FilterPanel wiring ─────────────────────────────────────────────
   * Role is single-select. FilterPanel models everything as multi-select
   * arrays, so we coerce on apply (matches the MarketplacePage pattern
   * for commission type + partner-links toggle).                       */
  const filterSections = useMemo(
    () => [
      {
        key: "role",
        label: t("filters.roleLabel"),
        type: "chips",
        options: [
          { value: "sales_partner", label: t("filters.rolePartner") },
          { value: "company",       label: t("filters.roleCompany") },
        ],
      },
    ],
    [t],
  );

  const handlePanelApply = (next) => {
    if (Array.isArray(next.role)) {
      // Single-select coercion: exactly one chip on → set; otherwise null.
      setRoleFilter(next.role.length === 1 ? next.role[0] : null);
    }
  };

  const handlePanelReset = () => setRoleFilter(null);

  const activeFilterCount = roleFilter ? 1 : 0;

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-DZ" : "en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const columns = useMemo(
    () => [
      {
        key: "display_name",
        label: t("columns.name"),
        width: "22em",
        render: (_, row) => (
          <div className="flex items-center gap-[0.75em] min-w-0">
            {row.role === "sales_partner" && row.profile?.profile_photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.profile.profile_photo}
                alt={row.display_name}
                className="w-[2em] h-[2em] rounded-[0.5em] object-cover border border-border-light shrink-0"
              />
            ) : row.role === "company" && row.profile?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.profile.logo}
                alt={row.display_name}
                className="w-[2em] h-[2em] rounded-[0.5em] object-cover border border-border-light shrink-0 bg-bg"
              />
            ) : (
              <Avatar name={row.display_name} size="sm" />
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-[0.875em] font-medium text-text truncate">
                {row.display_name}
              </span>
              <span className="text-[0.75em] text-text-muted truncate">{row.email}</span>
            </div>
          </div>
        ),
      },
      {
        key: "role",
        label: t("columns.role"),
        width: "9em",
        render: (_, row) => (
          <span className="inline-flex items-center gap-[0.375em] text-[0.8125em] text-text-secondary">
            {row.role === "sales_partner" ? (
              <>
                <UserCheck size="0.875em" strokeWidth={1.5} />
                {t("filters.rolePartner")}
              </>
            ) : (
              <>
                <Building2 size="0.875em" strokeWidth={1.5} />
                {t("filters.roleCompany")}
              </>
            )}
          </span>
        ),
      },
      {
        key: "created_at",
        label: t("columns.signupDate"),
        width: "8em",
        render: (v) => (
          <span className="text-[0.8125em] text-text-secondary">{formatDate(v)}</span>
        ),
      },
      {
        key: "days_waiting",
        label: t("columns.daysWaiting"),
        width: "6em",
        align: "right",
        sortable: true,
        render: (v) => (
          <span className="font-mono tabular-nums text-[0.8125em] text-text-secondary">
            {v === 0 ? "<1d" : `${v}d`}
          </span>
        ),
      },
      {
        key: "application_status",
        label: t("columns.status"),
        width: "9em",
        render: (v) => (
          <StatusBadge status={v} label={t(`statuses.${v}`)} />
        ),
      },
    ],
    [t, locale],
  );

  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[1.5em]">
      <PageHeader title={t("title")} description={t("description")} />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("filters.searchPlaceholder")}
        onFilterClick={() => setPanelOpen((v) => !v)}
        activeFilterCount={activeFilterCount}
        filterTriggerRef={filterTriggerRef}
      />

      <StatusTabs
        tabs={tabs}
        activeKey={activeTab}
        onChange={setActiveTab}
        counts={counts}
      />

      <FilterPanel
        triggerRef={filterTriggerRef}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onApply={handlePanelApply}
        onReset={handlePanelReset}
        sections={filterSections}
        activeCount={activeFilterCount}
        initialValues={{ role: roleFilter ? [roleFilter] : [] }}
      />

      <div className="max-w-[82em]">
        <DataTable
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          emptyTitle={t(`empty.${activeTab}.title`)}
          emptySubtitle={t(`empty.${activeTab}.body`)}
          onRowClick={(row) => setSelectedUser(row)}
          pageSize={10}
        />
      </div>

      <VerificationDetailOverlay
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
      />
    </div>
  );
}
