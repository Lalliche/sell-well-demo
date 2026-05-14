"use client";

/**
 * AdminUsersPage — admin /admin/users route.
 *
 * Layout (matches the project-wide list-page pattern — see MarketplacePage,
 * VerificationsPage, /leads, /applications, /partner-links):
 *
 *   PageHeader
 *   FilterBar  (Filters button → opens FilterPanel  ·  status chips  ·  search)
 *   StatusTabs (application_status: All / Pending / Approved / More info / Rejected)
 *   DataTable  (User · Role · Signed up · Status · Kebab)
 *     row click → AdminUserDetailOverlay
 *
 *   FilterPanel sections:
 *     - Role (chips, single-select coerced)
 *     - Suspension (chips, single-select coerced; tri-state: all / only / hide)
 *
 * Suspension is an ORTHOGONAL axis to application_status (per UX research:
 * Stripe / Linear / Mercury treat suspension as a row-level pill + a filter
 * panel toggle, never as a sibling tab). A `approved + suspended` user shows
 * under the Approved tab with a red "Suspended" pill next to their badge.
 *
 * Server-side filters (CLAUDE.md §3): tab, role, suspended, search ALL go
 * into the React Query queryKey AND into `fetchUsers`'s signature. No
 * `.filter()` on the React Query result.
 *
 * Authority: no leads here; standard admin-only route.
 */

import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import {
  Users as UsersIcon,
  UserCheck,
  Building2,
  Clock,
  CheckCircle2,
  MessageSquare,
  XCircle,
  Ban,
} from "lucide-react";

import PageHeader from "@/components/shared/layout/PageHeader";
import FilterBar from "@/components/shared/layout/FilterBar";
import FilterPanel from "@/components/shared/overlays/FilterPanel";
import StatusTabs from "@/components/shared/data-display/StatusTabs";
import StatusBadge from "@/components/shared/data-display/StatusBadge";
import Avatar from "@/components/shared/data-display/Avatar";
import DataTable from "@/components/shared/data-display/DataTable";
import { fetchUsers } from "@/lib/mock/admin";
import AdminUserDetailOverlay from "./AdminUserDetailOverlay";

export default function AdminUsersPage() {
  const t = useTranslations("Admin.users");
  const locale = useLocale();

  const [activeTab, setActiveTab] = useState("all");
  const [roleFilter, setRoleFilter] = useState(null);          // null | "sales_partner" | "company"
  const [suspendedFilter, setSuspendedFilter] = useState("all"); // "all" | "only" | "hide"
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [openOverlayId, setOpenOverlayId] = useState(null);
  const filterTriggerRef = useRef(null);

  const application_status = activeTab === "all" ? undefined : activeTab;

  const { data: rows = [], isLoading } = useQuery({
    queryKey: [
      "admin", "users",
      {
        application_status: application_status ?? null,
        role: roleFilter,
        suspended: suspendedFilter,
        search: search.trim(),
      },
    ],
    queryFn: () =>
      fetchUsers({
        application_status,
        role: roleFilter ?? undefined,
        suspended: suspendedFilter,
        search: search.trim() || undefined,
      }),
  });

  const tabs = useMemo(
    () => [
      { key: "all",                  label: t("tabs.all"),                icon: UsersIcon },
      { key: "pending_review",       label: t("tabs.pending_review"),     icon: Clock },
      { key: "approved",             label: t("tabs.approved"),           icon: CheckCircle2 },
      { key: "more_info_requested",  label: t("tabs.more_info_requested"),icon: MessageSquare },
      { key: "rejected",             label: t("tabs.rejected"),           icon: XCircle },
    ],
    [t],
  );

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
      {
        key: "suspended",
        label: t("filters.suspendedLabel"),
        type: "chips",
        options: [
          { value: "only", label: t("filters.suspendedOnly") },
          { value: "hide", label: t("filters.suspendedHide") },
        ],
      },
    ],
    [t],
  );

  const handlePanelApply = (next) => {
    if (Array.isArray(next.role)) {
      setRoleFilter(next.role.length === 1 ? next.role[0] : null);
    }
    if (Array.isArray(next.suspended)) {
      setSuspendedFilter(next.suspended.length === 1 ? next.suspended[0] : "all");
    }
  };

  const handlePanelReset = () => {
    setRoleFilter(null);
    setSuspendedFilter("all");
  };

  const activeFilterCount =
    (roleFilter ? 1 : 0) + (suspendedFilter !== "all" ? 1 : 0);

  /* ── Helpers ────────────────────────────────────────────────────────── */
  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-DZ" : "en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  /* ── Columns ────────────────────────────────────────────────────────── */
  const columns = useMemo(
    () => [
      {
        key: "display_name",
        label: t("columns.name"),
        width: "24em",
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
                {t("rolePartner")}
              </>
            ) : (
              <>
                <Building2 size="0.875em" strokeWidth={1.5} />
                {t("roleCompany")}
              </>
            )}
          </span>
        ),
      },
      {
        key: "created_at",
        label: t("columns.signupDate"),
        width: "9em",
        render: (v) => (
          <span className="text-[0.8125em] text-text-secondary">{formatDate(v)}</span>
        ),
      },
      {
        key: "application_status",
        label: t("columns.status"),
        width: "14em",
        render: (v, row) => (
          <div className="flex items-center gap-[0.4em] flex-wrap">
            <StatusBadge status={v} label={t(`statuses.${v}`)} />
            {row.is_suspended ? (
              <span className="inline-flex items-center gap-[0.3em] text-[0.6875em] font-semibold uppercase tracking-[0.04em] bg-status-rejected-bg text-status-rejected-text px-[0.625em] py-[0.25em] rounded-[0.375em]">
                <Ban size="0.875em" strokeWidth={2} />
                {t("suspendedPill")}
              </span>
            ) : null}
          </div>
        ),
      },
    ],
    [t, locale],
  );

  const emptyKey = ["all", "pending_review", "approved", "more_info_requested", "rejected"]
    .includes(activeTab) ? activeTab : "all";

  return (
    <div className="flex flex-col gap-[1.5em] px-[2em] py-[2em]">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

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
      />

      <FilterPanel
        triggerRef={filterTriggerRef}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onApply={handlePanelApply}
        onReset={handlePanelReset}
        sections={filterSections}
        activeCount={activeFilterCount}
        initialValues={{
          role: roleFilter ? [roleFilter] : [],
          suspended: suspendedFilter !== "all" ? [suspendedFilter] : [],
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

      <AdminUserDetailOverlay
        userId={openOverlayId}
        open={openOverlayId !== null}
        onClose={() => setOpenOverlayId(null)}
      />
    </div>
  );
}
