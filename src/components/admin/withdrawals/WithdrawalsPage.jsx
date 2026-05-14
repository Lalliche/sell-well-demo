"use client";

/**
 * WithdrawalsPage — admin /admin/withdrawals route.
 *
 * Layout (project-wide list-page pattern, same shape as /admin/verifications):
 *
 *   PageHeader
 *   FilterBar  (search + Filters button → FilterPanel)
 *   StatusTabs (pending · processing · completed · rejected, with global counts)
 *   DataTable  (requester · amount · method · destination · requested · days waiting · status)
 *     row click → WithdrawalDetailOverlay
 *
 *   FilterPanel sections:
 *     - Role  (sales_partner | company — single-select coerced from chip multi-select)
 *     - Since (last 7d | 30d | 90d | all-time — single-select)
 *
 * All filters server-side via fetchAdminWithdrawalRequests({ role, status,
 * search, since }) per CLAUDE.md §3.
 *
 * Days-waiting cell uses age-toned color escalation
 * (gray <2d · amber 2–7d · red >7d) so stale rows are impossible to miss.
 *
 * Destination column shows masked last-4 only; full unmasked details
 * (account + key + holder) live in the detail overlay.
 */

import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Banknote,
  Landmark,
  Building2,
  User as UserIcon,
} from "lucide-react";

import PageHeader from "@/components/shared/layout/PageHeader";
import FilterBar from "@/components/shared/layout/FilterBar";
import FilterPanel from "@/components/shared/overlays/FilterPanel";
import StatusTabs from "@/components/shared/data-display/StatusTabs";
import StatusBadge from "@/components/shared/data-display/StatusBadge";
import Avatar from "@/components/shared/data-display/Avatar";
import DataTable from "@/components/shared/data-display/DataTable";
import { formatRelative } from "@/lib/format/relative-time";
import { format } from "@/lib/format/currency";
import { cn } from "@/lib/utils";
import { fetchAdminWithdrawalRequests } from "@/lib/mock/admin";
import WithdrawalDetailOverlay from "./WithdrawalDetailOverlay";

const SINCE_OPTIONS = [
  { value: "7d",  days: 7 },
  { value: "30d", days: 30 },
  { value: "90d", days: 90 },
];

/** Mask all but the last 4 chars of a numeric account string. Strips
 *  whitespace first so spaces in the RIB don't get counted. */
function maskLast4(raw) {
  if (!raw) return "—";
  const digits = String(raw).replace(/\s+/g, "");
  if (digits.length <= 4) return digits;
  return `…${digits.slice(-4)}`;
}

/** Pick the destination summary string shown in the table cell. */
function destinationSummary(row, t) {
  const dest = row.destination_snapshot ?? {};
  if (row.payout_method === "ccp") {
    return `${t("methods.ccp")} ${maskLast4(dest.ccp_account)}`;
  }
  return `${t("methods.bank")} ${maskLast4(dest.rib)}`;
}

/** Age-tone for days-waiting: green <2d, amber 2-7d, red >7d. Applied to
 *  cell text so it pops without needing a wrapper pill. */
function ageToneClass(days) {
  if (days >= 7) return "text-status-rejected-text";
  if (days >= 2) return "text-status-pending-text";
  return "text-text-secondary";
}

export default function WithdrawalsPage() {
  const t = useTranslations("Admin.withdrawals");
  // formatRelative needs its own translator with justNow / minsAgo /
  // hoursAgo / daysAgo. We piggyback on the Notifications.Time namespace
  // already populated for the notification feed — same compact "3d ago"
  // copy that admins are used to seeing elsewhere in the chrome.
  const tTime = useTranslations("Dashboard.Notifications.Time");
  const locale = useLocale();

  const [activeTab, setActiveTab] = useState("pending");
  const [roleFilter, setRoleFilter] = useState(null);  // null | "sales_partner" | "company"
  const [sinceKey, setSinceKey] = useState(null);      // null | "7d" | "30d" | "90d"
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const filterTriggerRef = useRef(null);

  // Resolve sinceKey → ISO string the mock understands.
  const sinceIso = useMemo(() => {
    if (!sinceKey) return undefined;
    const opt = SINCE_OPTIONS.find((o) => o.value === sinceKey);
    if (!opt) return undefined;
    return new Date(Date.now() - opt.days * 86400000).toISOString();
  }, [sinceKey]);

  // Main queue query — all filters server-side.
  const { data: rows = [], isLoading } = useQuery({
    queryKey: [
      "admin", "withdrawals",
      { status: activeTab, role: roleFilter, since: sinceKey, search: search.trim() },
    ],
    queryFn: () =>
      fetchAdminWithdrawalRequests({
        status: activeTab,
        role: roleFilter ?? undefined,
        since: sinceIso,
        search: search.trim() || undefined,
      }),
  });

  // Tab counts — ignore role + since + search to show the global queue
  // depth per status (matches /admin/verifications pattern).
  const { data: pendingAll = [] } = useQuery({
    queryKey: ["admin", "withdrawals", { status: "pending", role: null, since: null, search: "" }],
    queryFn: () => fetchAdminWithdrawalRequests({ status: "pending" }),
  });
  const { data: processingAll = [] } = useQuery({
    queryKey: ["admin", "withdrawals", { status: "processing", role: null, since: null, search: "" }],
    queryFn: () => fetchAdminWithdrawalRequests({ status: "processing" }),
  });
  const { data: completedAll = [] } = useQuery({
    queryKey: ["admin", "withdrawals", { status: "completed", role: null, since: null, search: "" }],
    queryFn: () => fetchAdminWithdrawalRequests({ status: "completed" }),
  });
  const { data: rejectedAll = [] } = useQuery({
    queryKey: ["admin", "withdrawals", { status: "rejected", role: null, since: null, search: "" }],
    queryFn: () => fetchAdminWithdrawalRequests({ status: "rejected" }),
  });

  const tabs = [
    { key: "pending",    label: t("tabs.pending"),    icon: Clock },
    { key: "processing", label: t("tabs.processing"), icon: Loader2 },
    { key: "completed",  label: t("tabs.completed"),  icon: CheckCircle2 },
    { key: "rejected",   label: t("tabs.rejected"),   icon: XCircle },
  ];

  const counts = {
    pending:    pendingAll.length,
    processing: processingAll.length,
    completed:  completedAll.length,
    rejected:   rejectedAll.length,
  };

  /* ── FilterPanel sections (Role + Since) ─────────────────────────── */
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
        key: "since",
        label: t("filters.sinceLabel"),
        type: "chips",
        options: SINCE_OPTIONS.map((o) => ({
          value: o.value,
          label: t(`filters.since.${o.value}`),
        })),
      },
    ],
    [t],
  );

  const handlePanelApply = (next) => {
    if (Array.isArray(next.role)) {
      setRoleFilter(next.role.length === 1 ? next.role[0] : null);
    }
    if (Array.isArray(next.since)) {
      setSinceKey(next.since.length === 1 ? next.since[0] : null);
    }
  };
  const handlePanelReset = () => {
    setRoleFilter(null);
    setSinceKey(null);
  };
  const activeFilterCount = (roleFilter ? 1 : 0) + (sinceKey ? 1 : 0);

  const formatRelTime = (iso) => {
    if (!iso) return "—";
    return formatRelative(iso, tTime);
  };

  const columns = useMemo(
    () => [
      {
        key: "display_name",
        label: t("columns.requester"),
        width: "20em",
        render: (_, row) => (
          <div className="flex items-center gap-[0.625em] min-w-0">
            <Avatar name={row.display_name} size="sm" />
            <div className="flex flex-col min-w-0">
              <span className="text-[0.875em] font-medium text-text truncate">
                {row.display_name}
              </span>
              <span className="inline-flex items-center gap-[0.25em] text-[0.6875em] text-text-muted">
                {row.requester_role === "company" ? (
                  <>
                    <Building2 size="0.6875em" strokeWidth={1.75} />
                    {t("roles.company")}
                  </>
                ) : (
                  <>
                    <UserIcon size="0.6875em" strokeWidth={1.75} />
                    {t("roles.partner")}
                  </>
                )}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "amount",
        label: t("columns.amount"),
        width: "8em",
        align: "right",
        sortable: true,
        render: (v) => (
          <span className="font-mono tabular-nums font-semibold text-[0.875em] text-text">
            {format(v)}
          </span>
        ),
      },
      {
        key: "payout_method",
        label: t("columns.method"),
        width: "5em",
        render: (v) => (
          <span className="inline-flex items-center gap-[0.375em] text-[0.75em] font-medium text-text-secondary uppercase tracking-[0.04em]">
            {v === "ccp" ? (
              <Banknote size="0.875em" strokeWidth={1.75} />
            ) : (
              <Landmark size="0.875em" strokeWidth={1.75} />
            )}
            {v === "ccp" ? t("methods.ccp") : t("methods.bank")}
          </span>
        ),
      },
      {
        key: "destination",
        label: t("columns.destination"),
        width: "8em",
        render: (_, row) => (
          <span className="font-mono tabular-nums text-[0.75em] text-text-secondary">
            {destinationSummary(row, t)}
          </span>
        ),
      },
      {
        key: "requested_at",
        label: t("columns.requested"),
        width: "7em",
        render: (v) => (
          <span className="text-[0.8125em] text-text-secondary">
            {formatRelTime(v)}
          </span>
        ),
      },
      {
        key: "days_waiting",
        label: t("columns.daysWaiting"),
        width: "5em",
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
        width: "7em",
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
        initialValues={{
          role:  roleFilter ? [roleFilter] : [],
          since: sinceKey   ? [sinceKey]   : [],
        }}
      />

      <div className="max-w-[82em]">
        <DataTable
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          emptyTitle={t(`empty.${activeTab}.title`)}
          emptySubtitle={t(`empty.${activeTab}.body`)}
          onRowClick={(row) => setSelectedRow(row)}
          pageSize={15}
        />
      </div>

      <WithdrawalDetailOverlay
        open={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        row={selectedRow}
      />
    </div>
  );
}
