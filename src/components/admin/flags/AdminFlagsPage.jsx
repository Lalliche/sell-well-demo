"use client";

/**
 * AdminFlagsPage — admin /admin/flags route.
 *
 * Single polymorphic table. Top StatusTabs switch between Sales Partners
 * (default) and Tech Companies — they're scored on different axes (fake-
 * lead flags vs unreported-sale flags) so we let admin pick one lens at a
 * time. Threshold filter ("≥1 flag" default · "≥3 flag alert") lives inside
 * FilterPanel.
 *
 * Server-side filters per CLAUDE.md §3: role + min_count + search thread
 * through React Query queryKey and `fetchFlags` signature. Row click opens
 * `AdminUserDetailOverlay` — the same overlay /admin/users uses, so the
 * admin reads identical Profile + Account + Activity data (no fork).
 */

import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { UserCheck, Building2, Flag } from "lucide-react";

import PageHeader from "@/components/shared/layout/PageHeader";
import FilterBar from "@/components/shared/layout/FilterBar";
import FilterPanel from "@/components/shared/overlays/FilterPanel";
import StatusTabs from "@/components/shared/data-display/StatusTabs";
import Avatar from "@/components/shared/data-display/Avatar";
import DataTable from "@/components/shared/data-display/DataTable";
import { cn } from "@/lib/utils";
import { fetchFlags } from "@/lib/mock/admin";
import AdminUserDetailOverlay from "@/components/admin/users/AdminUserDetailOverlay";

export default function AdminFlagsPage() {
  const t = useTranslations("Admin.flags");
  const locale = useLocale();

  const [activeRole, setActiveRole] = useState("sales_partner"); // default = partners
  // `preset` is one of "all" (0) · "one" (1) · "three" (3) · "custom".
  // When preset === "custom" we read the threshold from `customMinFlags`
  // (an integer the admin types into the FilterPanel number input).
  // Default = "one" (i.e. ≥1) so we never surface zero-flag rows on first
  // paint, matching the "flagged" semantics of the page.
  const [preset, setPreset] = useState("one");
  const [customMinFlags, setCustomMinFlags] = useState(1);
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [openUserId, setOpenUserId] = useState(null);
  const filterTriggerRef = useRef(null);

  // Resolve preset → actual min_count threshold the mock fn applies.
  const effectiveMinFlags = useMemo(() => {
    if (preset === "all") return 0;
    if (preset === "one") return 1;
    if (preset === "three") return 3;
    // custom: clamp to a sane non-negative integer
    return Number.isFinite(customMinFlags) && customMinFlags >= 0 ? customMinFlags : 0;
  }, [preset, customMinFlags]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "flags", { role: activeRole, min_count: effectiveMinFlags, search: search.trim() }],
    queryFn: () =>
      fetchFlags({
        role: activeRole,
        min_count: effectiveMinFlags,
        search: search.trim() || undefined,
      }),
  });

  const tabs = useMemo(
    () => [
      { key: "sales_partner", label: t("tabs.sales_partner"), icon: UserCheck },
      { key: "company",       label: t("tabs.company"),       icon: Building2 },
    ],
    [t],
  );

  const filterSections = useMemo(
    () => [
      {
        key: "min_flags_preset",
        label: t("filters.minFlagsLabel"),
        type: "chips",
        singleSelect: true,
        options: [
          { value: "all",    label: t("filters.minFlagsAll")    },
          { value: "one",    label: t("filters.minFlagsOne")    },
          { value: "three",  label: t("filters.minFlagsThree")  },
          { value: "custom", label: t("filters.minFlagsCustom") },
        ],
      },
      // Conditionally revealed when preset === "custom". FilterPanel hides
      // any section flagged with `hidden: true`.
      {
        key: "min_flags_custom",
        label: t("filters.minFlagsCustomLabel"),
        type: "numberInput",
        minValue: 0,
        placeholder: t("filters.minFlagsCustomPlaceholder"),
        hidden: preset !== "custom",
      },
    ],
    [t, preset],
  );

  const handlePanelApply = (next) => {
    if (Array.isArray(next.min_flags_preset)) {
      // FilterPanel's singleSelect mode returns 0 or 1 entry. Empty means
      // admin clicked the active chip to clear; we keep the previous preset
      // instead of crashing (the page must always have one).
      if (next.min_flags_preset.length === 1) {
        const sel = next.min_flags_preset[0];
        setPreset(sel);
        // Leaving "custom" → reset the typed number so a future visit to
        // "custom" starts from a sensible default.
        if (sel !== "custom") setCustomMinFlags(1);
      }
    }
    if (Object.prototype.hasOwnProperty.call(next, "min_flags_custom")) {
      const v = next.min_flags_custom;
      setCustomMinFlags(typeof v === "number" && v >= 0 ? v : 0);
    }
  };
  const handlePanelReset = () => {
    setPreset("one");
    setCustomMinFlags(1);
  };
  const activeFilterCount = preset !== "one" ? 1 : 0;

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
            {row.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.avatar}
                alt={row.display_name}
                className={cn(
                  "w-[2em] h-[2em] rounded-[0.5em] object-cover border border-border-light shrink-0",
                  row.role === "company" && "bg-bg",
                )}
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
        key: "flag_count",
        label: t("columns.flagCount"),
        width: "8em",
        align: "right",
        sortable: true,
        render: (v) => (
          <span
            className={cn(
              "font-mono tabular-nums text-[0.875em]",
              v >= 3 ? "text-status-rejected-text font-semibold" : "text-text-secondary",
            )}
          >
            <Flag
              size="0.875em"
              strokeWidth={2}
              className={cn(
                "inline mr-[0.375em] mt-[-0.0625em]",
                v >= 3 ? "text-status-rejected-text" : "text-text-muted",
              )}
            />
            {v}
          </span>
        ),
      },
      {
        key: "last_flag_date",
        label: t("columns.lastFlagDate"),
        width: "10em",
        render: (v) => (
          <span className="text-[0.8125em] text-text-secondary">{formatDate(v)}</span>
        ),
      },
    ],
    [t, locale],
  );

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

      <StatusTabs tabs={tabs} activeKey={activeRole} onChange={setActiveRole} />

      <FilterPanel
        triggerRef={filterTriggerRef}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onApply={handlePanelApply}
        onReset={handlePanelReset}
        sections={filterSections}
        activeCount={activeFilterCount}
        initialValues={{
          min_flags_preset: [preset],
          min_flags_custom: preset === "custom" ? customMinFlags : null,
        }}
      />

      <div className="max-w-[82em]">
        <DataTable
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          emptyTitle={t(`empty.${activeRole}.title`)}
          emptySubtitle={t(`empty.${activeRole}.body`)}
          onRowClick={(row) => setOpenUserId(row.user_id)}
          pageSize={10}
        />
      </div>

      <AdminUserDetailOverlay
        userId={openUserId}
        open={openUserId !== null}
        onClose={() => setOpenUserId(null)}
      />
    </div>
  );
}
