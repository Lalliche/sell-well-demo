"use client";

/**
 * CompanyApplicationsPage — company-side /applications view.
 *
 * Layout: PageHeader → FilterBar (search + active-campaign chip + Clear)
 *         → StatusTabs (All · Pending · Approved · Rejected) → DataTable
 *         → CompanyApplicationDetailOverlay (per-row click).
 *
 * URL query-param sync:
 *   ?campaign=<slug>  → filters the table to one campaign and renders
 *                        an active-campaign chip in the FilterBar with
 *                        a Clear (X) affordance. Pre-populated from the
 *                        URL on mount; updates on Clear.
 *   ?open=<id>        → auto-opens the overlay for that application id.
 *                        Updated when the user clicks a row + cleared
 *                        when the overlay closes.
 *
 * URL writes go through `router.replace(..., { scroll: false })` so the
 * back button still has a sensible history (the user lands on the
 * /applications page, not in the middle of overlay state).
 *
 * Verification gate is enforced inside the overlay (Approve/Reject
 * disabled with tooltip). The list itself stays viewable while pending.
 */

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";
import { FiInbox, FiClock, FiCheckCircle, FiXCircle, FiX } from "react-icons/fi";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchCompanyApplications, fetchCompanyCampaigns } from "@/lib/mock/campaigns";
import PageHeader from "@/components/shared/layout/PageHeader";
import DataTable from "@/components/shared/data-display/DataTable";
import StatusTabs from "@/components/shared/data-display/StatusTabs";
import SearchInput from "@/components/shared/layout/SearchInput";
import CompanyApplicationDetailOverlay from "./CompanyApplicationDetailOverlay";
import CompanyApplicationsEmptyState from "./applications-page/CompanyApplicationsEmptyState";
import { buildCompanyApplicationsColumns } from "./applications-page/company-applications-table-columns";

const TAB_KEYS = ["all", "pending", "approved", "rejected"];
const TAB_ICONS = {
  all: FiInbox,
  pending: FiClock,
  approved: FiCheckCircle,
  rejected: FiXCircle,
};

export default function CompanyApplicationsPage() {
  const t = useTranslations("Applications.companyList");
  const tTime = useTranslations("Applications.time");
  const tTable = useTranslations("Applications.companyList.table");
  const locale = useLocale();
  const { user } = useAuth();
  const companyId = user?.role === "company" ? (user.profile?.id ?? user?.id) : null;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const campaignSlugFromUrl = searchParams.get("campaign");
  const openIdFromUrl = searchParams.get("open");

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [openRow, setOpenRow] = useState(null);

  // Replace the URL preserving scroll position. Always pass a fresh
  // query-string built from the current state so callers don't have to
  // think about merging.
  const updateUrl = useCallback(
    ({ campaign, openId }) => {
      const params = new URLSearchParams();
      if (campaign) params.set("campaign", campaign);
      if (openId)   params.set("open", String(openId));
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  // Fetch all applications for this company (search + status filter
  // applied client-side; volume is bounded per company so paging is
  // enough to cover scale).
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["company-applications", { companyId }],
    queryFn: () => fetchCompanyApplications({ companyId }),
    enabled: !!companyId,
  });

  // Lookup helper for the active-campaign chip — fetched lazily so the
  // page works even when no `?campaign=` is in the URL.
  const { data: companyCampaigns = [] } = useQuery({
    queryKey: ["company-campaigns", companyId, { search: "" }],
    queryFn: () => fetchCompanyCampaigns({ companyId }),
    enabled: !!companyId && !!campaignSlugFromUrl,
  });
  const activeCampaign = useMemo(
    () =>
      campaignSlugFromUrl
        ? companyCampaigns.find((c) => c.slug === campaignSlugFromUrl) ?? null
        : null,
    [campaignSlugFromUrl, companyCampaigns],
  );

  // Filter pipeline: campaign-slug → search → tab.
  const filtered = useMemo(() => {
    let r = rows;
    if (campaignSlugFromUrl) {
      r = r.filter((row) => row.campaign?.slug === campaignSlugFromUrl);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      r = r.filter((row) => {
        const partner = row.partner;
        const name = partner ? `${partner.first_name} ${partner.last_name}`.toLowerCase() : "";
        const product = (row.campaign?.product_name ?? "").toLowerCase();
        const pitch = (row.pitch ?? "").toLowerCase();
        return name.includes(q) || product.includes(q) || pitch.includes(q);
      });
    }
    return r;
  }, [rows, campaignSlugFromUrl, search]);

  const counts = useMemo(() => {
    const c = { all: filtered.length, pending: 0, approved: 0, rejected: 0 };
    for (const r of filtered) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [filtered]);

  const visibleRows = useMemo(
    () => (activeTab === "all" ? filtered : filtered.filter((r) => r.status === activeTab)),
    [filtered, activeTab],
  );

  const columns = useMemo(
    () => buildCompanyApplicationsColumns({ locale, tTable, tTime }),
    [locale, tTable, tTime],
  );

  // Open the overlay whenever the URL carries `?open=<id>` and that id
  // exists in the loaded rows — covers both first mount (deep link from
  // /campaigns/[slug]/RecentApplicationsPreview) and any later URL push.
  //
  // `closedIdRef` tracks the id the user last *closed* on. While that id
  // still rides the URL (router.replace is async — for a brief window
  // after Close, the URL still carries the stale ?open=<id>), this guard
  // prevents the effect from reopening what the user just closed. Once
  // the URL drops the param, the ref clears and a fresh deep link to
  // the same id reopens cleanly.
  const closedIdRef = useRef(null);
  useEffect(() => {
    if (!openIdFromUrl) {
      closedIdRef.current = null;
      return;
    }
    const id = openIdFromUrl;
    if (!id) return;
    if (closedIdRef.current === id) return;
    if (rows.length === 0) return;
    if (openRow?.id === id) return;
    const target = rows.find((r) => String(r.id) === String(id));
    if (!target) return;
    const tid = setTimeout(() => setOpenRow(target), 0);
    return () => clearTimeout(tid);
  }, [openIdFromUrl, rows, openRow]);

  // When the user opens / closes the overlay, sync the URL.
  const handleRowClick = (row) => {
    setOpenRow(row);
    updateUrl({ campaign: campaignSlugFromUrl, openId: row.id });
  };
  const handleCloseOverlay = () => {
    // Mark the id we're closing so the auto-open effect doesn't reopen
    // it during the brief window where the URL still has `?open=<id>`
    // (router.replace is async). The ref clears when the URL param drops.
    closedIdRef.current = openRow?.id ? String(openRow.id) : null;
    setOpenRow(null);
    updateUrl({ campaign: campaignSlugFromUrl, openId: null });
  };
  const handleClearCampaign = () => {
    updateUrl({ campaign: null, openId: openRow?.id ?? null });
  };

  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[1.5em]">
      <PageHeader title={t("title")} description={t("description")} />

      {/* FilterBar-equivalent: search + active-campaign chip. We use the
          same pattern as the partner-side page (StatusTabs + SearchInput
          side-by-side) plus an extra chip when ?campaign= is in the URL.
          Done inline rather than via the FilterBar primitive because
          the chip semantics here are URL-driven, not chip-toggle-driven. */}
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

      {activeCampaign && (
        <div className="flex items-center gap-[0.625em]">
          <span className="text-[0.75em] uppercase tracking-[0.06em] font-semibold text-text-muted">
            {t("filteredBy")}
          </span>
          <button
            type="button"
            onClick={handleClearCampaign}
            className="inline-flex items-center gap-[0.375em] h-[1.875em] pl-[0.75em] pr-[0.5em] rounded-full bg-accent-light text-accent-text text-[0.75em] font-semibold hover:bg-accent/15 transition-[background-color] duration-150 ease-out"
          >
            <span>{activeCampaign.product_name}</span>
            <FiX size="0.75em" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {visibleRows.length === 0 && !isLoading ? (
        <div className="bg-surface border border-border-light rounded-[0.625em] shadow-xs">
          <CompanyApplicationsEmptyState tab={activeTab} t={t} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={visibleRows}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          pageSize={10}
        />
      )}

      <CompanyApplicationDetailOverlay
        open={!!openRow}
        onClose={handleCloseOverlay}
        application={openRow}
      />
    </div>
  );
}
