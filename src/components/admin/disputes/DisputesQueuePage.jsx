"use client";

/**
 * DisputesQueuePage — admin /admin/disputes route.
 *
 * Authority constraint (load-bearing, see Phase 9 header in FRONTEND_TODO):
 * this is the ONLY page that exposes leads to admin. Lead visibility is
 * restricted to `disputed_verifying`, `expired_verifying`, and
 * `not_converted`. All three statuses are surfaced via tabs here; admin
 * never sees any other lead status anywhere on the platform.
 *
 * Layout (project-wide list-page pattern):
 *   PageHeader
 *   FilterBar  (search over client name + campaign + partner + company)
 *   StatusTabs (Active disputes · Expired-verifying · Resolved, with counts)
 *   DataTable  → row click navigates to /admin/disputes/[slug]
 *
 * The "Resolved" tab is read-only — `not_converted` leads are kept here for
 * after-the-fact audit. Their detail page hides the resolution action
 * buttons (handled on the detail page, not here).
 *
 * Filters are server-side per CLAUDE.md §3 — search threads through the
 * queryKey + into fetchDisputes. The Withdrawal page added age-toned
 * `days_waiting` cells; we keep that here too since stale disputes are
 * money sitting in escrow and worth highlighting.
 */

import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { AlertTriangle, Clock, Archive, User as UserIcon, Building2 } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import PageHeader from "@/components/shared/layout/PageHeader";
import FilterBar from "@/components/shared/layout/FilterBar";
import StatusTabs from "@/components/shared/data-display/StatusTabs";
import StatusBadge from "@/components/shared/data-display/StatusBadge";
import Avatar from "@/components/shared/data-display/Avatar";
import DataTable from "@/components/shared/data-display/DataTable";
import { formatRelative } from "@/lib/format/relative-time";
import { cn } from "@/lib/utils";
import { fetchDisputes } from "@/lib/mock/admin";

const TAB_STATUSES = ["disputed_verifying", "expired_verifying", "not_converted"];

function ageToneClass(days) {
  if (days >= 14) return "text-status-rejected-text";
  if (days >= 5)  return "text-status-pending-text";
  return "text-text-secondary";
}

export default function DisputesQueuePage() {
  const t = useTranslations("Admin.disputes");
  const tTime = useTranslations("Dashboard.Notifications.Time");
  const locale = useLocale();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("disputed_verifying");
  const [search, setSearch] = useState("");
  const filterTriggerRef = useRef(null);

  // Main query — all filters server-side per CLAUDE.md §3. Status, search
  // (over client name + campaign + partner + company name) all thread
  // through the queryKey so React Query caches each combination.
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "disputes", { status: activeTab, search: search.trim() }],
    queryFn: () =>
      fetchDisputes({
        status: activeTab,
        search: search.trim() || undefined,
      }),
  });

  // Tab counts — separate queries, ignore search so the chip always shows
  // global queue depth per status.
  const { data: activeAll = [] } = useQuery({
    queryKey: ["admin", "disputes", { status: "disputed_verifying", search: "" }],
    queryFn: () => fetchDisputes({ status: "disputed_verifying" }),
  });
  const { data: expiredAll = [] } = useQuery({
    queryKey: ["admin", "disputes", { status: "expired_verifying", search: "" }],
    queryFn: () => fetchDisputes({ status: "expired_verifying" }),
  });
  const { data: resolvedAll = [] } = useQuery({
    queryKey: ["admin", "disputes", { status: "not_converted", search: "" }],
    queryFn: () => fetchDisputes({ status: "not_converted" }),
  });

  const tabs = [
    { key: "disputed_verifying", label: t("tabs.active"),   icon: AlertTriangle },
    { key: "expired_verifying",  label: t("tabs.expired"),  icon: Clock },
    { key: "not_converted",      label: t("tabs.resolved"), icon: Archive },
  ];
  const counts = {
    disputed_verifying: activeAll.length,
    expired_verifying:  expiredAll.length,
    not_converted:      resolvedAll.length,
  };

  const formatRelTime = (iso) => {
    if (!iso) return "—";
    return formatRelative(iso, tTime);
  };

  const columns = useMemo(
    () => [
      {
        key: "client_full_name",
        label: t("columns.client"),
        width: "16em",
        render: (_, row) => (
          <div className="flex items-center gap-[0.625em] min-w-0">
            <Avatar name={row.client_full_name} size="sm" />
            <div className="flex flex-col min-w-0">
              <span className="text-[0.875em] font-medium text-text truncate">
                {row.client_full_name}
              </span>
              {row.client_phone && (
                <span className="text-[0.6875em] text-text-muted font-mono tabular-nums truncate">
                  {row.client_phone}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "campaign_name",
        label: t("columns.campaign"),
        width: "14em",
        render: (v, row) => (
          <div className="flex flex-col min-w-0">
            <span className="text-[0.8125em] text-text truncate">{v ?? "—"}</span>
            <span className="inline-flex items-center gap-[0.25em] text-[0.6875em] text-text-muted">
              <Building2 size="0.6875em" strokeWidth={1.75} />
              <span className="truncate">{row.company_name ?? "—"}</span>
            </span>
          </div>
        ),
      },
      {
        key: "partner_name",
        label: t("columns.partner"),
        width: "12em",
        render: (v) => (
          <span className="inline-flex items-center gap-[0.375em] text-[0.8125em] text-text-secondary truncate">
            <UserIcon size="0.8125em" strokeWidth={1.75} />
            {v ?? "—"}
          </span>
        ),
      },
      {
        key: "submitted_at",
        label: t("columns.submitted"),
        width: "8em",
        render: (v) => (
          <span className="text-[0.8125em] text-text-secondary">{formatRelTime(v)}</span>
        ),
      },
      {
        key: "days_waiting",
        label: t("columns.daysWaiting"),
        width: "6em",
        align: "right",
        sortable: true,
        render: (v) => (
          <span className={cn(
            "font-mono tabular-nums text-[0.8125em] font-semibold",
            ageToneClass(v),
          )}>
            {v === 0 ? "<1d" : `${v}d`}
          </span>
        ),
      },
      {
        key: "status",
        label: t("columns.status"),
        width: "8em",
        render: (v) => (
          <StatusBadge status={v} label={t(`statuses.${v}`)} />
        ),
      },
    ],
    [t, locale, tTime],
  );

  const handleRowClick = (row) => {
    router.push(`/admin/disputes/${row.slug}`);
  };

  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[1.5em]">
      <PageHeader title={t("title")} description={t("description")} />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("filters.searchPlaceholder")}
        filterTriggerRef={filterTriggerRef}
      />

      <StatusTabs
        tabs={tabs}
        activeKey={activeTab}
        onChange={setActiveTab}
        counts={counts}
      />

      <div className="max-w-[82em]">
        <DataTable
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          emptyTitle={t(`empty.${activeTab}.title`)}
          emptySubtitle={t(`empty.${activeTab}.body`)}
          onRowClick={handleRowClick}
          pageSize={15}
        />
      </div>
    </div>
  );
}
