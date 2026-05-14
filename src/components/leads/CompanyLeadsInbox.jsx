"use client";

/**
 * CompanyLeadsInbox — company-side /leads view (Phase 7.6).
 *
 * Layout:
 *   1. PageHeader
 *   2. LeadInboxWalletHeader — full-width Vault Meter band, animated.
 *   3. FilterBar — search (left) + Sort + Filters (right slot).
 *   4. StatusTabs — All · Awaiting reservation · In tracking window ·
 *      Awaiting confirmation · Disputed · Closed (live counts).
 *   5. Active-filter chips — shows campaign / partner pills with X clear
 *      when those filters are active.
 *   6. DataTable — full-width.
 *
 * Filters (FilterPanel, anchored under the Filters button):
 *   - campaignIds — multi-select Campaign chips (company's own campaigns)
 *   - partnerIds  — multi-select Partner chips (partners who've actually
 *                   submitted to this company; computed from the rows)
 *
 * Sort (LeadsInboxSort popover):
 *   - newest             — submitted_at desc (default)
 *   - reservation_high   — total_reservation desc
 *   - reservation_low    — total_reservation asc
 *
 * URL query-param sync:
 *   ?campaign=<slug>     — pre-populates campaignIds with that slug's id
 *   ?open=<id>           — auto-opens that lead in the detail overlay
 *
 * Reserve & View flow:
 *   row → click button → ReserveConfirmDialog → mutate acknowledgeLead
 *   → wallet refetches and animates (Vault Meter pattern, partition bar
 *   slides + counters tick) → table refetches with masked contact lifted.
 *   On success we briefly stash the reservation amount in
 *   `lastReservedAmount` so the wallet header can flash a `-X` ghost
 *   number next to Available while the new balance ticks down.
 */

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";
import {
  FiInbox,
  FiClock,
  FiActivity,
  FiAlertTriangle,
  FiArchive,
  FiX,
} from "react-icons/fi";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchCompanyLeads, acknowledgeLead, confirmSale, denyConversion } from "@/lib/mock/leads";
import { fetchWallet, fetchTransactions } from "@/lib/mock/escrow";
import { fetchCompanyCampaigns } from "@/lib/mock/campaigns";
import { useToast } from "@/hooks/useToast";
import PageHeader from "@/components/shared/layout/PageHeader";
import DataTable from "@/components/shared/data-display/DataTable";
import StatusTabs from "@/components/shared/data-display/StatusTabs";
import FilterBar from "@/components/shared/layout/FilterBar";
import FilterPanel from "@/components/shared/overlays/FilterPanel";
import AppButton from "@/components/ui/Buttons";
import CompanyLeadDetailOverlay from "./CompanyLeadDetailOverlay";
import LeadInboxWalletHeader from "./leads-inbox/LeadInboxWalletHeader";
import LeadsInboxSort from "./leads-inbox/LeadsInboxSort";
import { buildCompanyLeadsInboxColumns } from "./leads-inbox/company-leads-inbox-columns";
import { classifyCompanyTab } from "./leads-inbox/classify-company-tab";
import CompanyLeadsInboxEmptyState from "./leads-inbox/CompanyLeadsInboxEmptyState";
import ReserveConfirmDialog from "./leads-inbox/ReserveConfirmDialog";
import ConfirmSaleDialog from "./leads-inbox/ConfirmSaleDialog";
import DenyConversionDialog from "./leads-inbox/DenyConversionDialog";

const TAB_KEYS = ["all", "awaitingReserve", "inWindow", "awaitingConfirm", "disputed", "closed"];
const TAB_ICONS = {
  all: FiInbox,
  awaitingReserve: FiClock,
  inWindow: FiActivity,
  awaitingConfirm: FiAlertTriangle,
  disputed: FiAlertTriangle,
  closed: FiArchive,
};

export default function CompanyLeadsInbox() {
  const t = useTranslations("Leads.companyInbox");
  const tFilter = useTranslations("Leads.companyInbox.filter");
  const tTime = useTranslations("Leads.time");
  const tTable = useTranslations("Leads.companyInbox.table");
  const tCells = useTranslations("Leads.companyInbox.cells");
  const locale = useLocale();
  const { user, ready } = useAuth();
  const companyId = user?.role === "company" ? (user.profile?.id ?? user?.id) : null;
  const enabled = ready && !!companyId;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const campaignSlugFromUrl = searchParams.get("campaign");
  const openIdFromUrl = searchParams.get("open");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [campaignIds, setCampaignIds] = useState([]);
  const [partnerIds, setPartnerIds] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [openRow, setOpenRow] = useState(null);
  const [reserveTarget, setReserveTarget] = useState(null);
  const [confirmSaleTarget, setConfirmSaleTarget] = useState(null);
  const [denyTarget, setDenyTarget] = useState(null);
  // Stashed on Reserve success — drives the `-{amount}` ghost number
  // that flashes next to Available while the wallet ticks down.
  const [lastReservedAmount, setLastReservedAmount] = useState(null);

  const filterTriggerRef = useRef(null);

  // `now` captured via effect (Date.now is impure — React 19 rule).
  const [now, setNow] = useState(null);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setNow(Date.now()));
    return () => cancelAnimationFrame(raf);
  }, []);

  const updateUrl = useCallback(
    ({ campaign, openId }) => {
      const params = new URLSearchParams();
      if (campaign) params.set("campaign", campaign);
      if (openId) params.set("open", String(openId));
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  // Fetch all company leads once — campaign/partner filtering happens
  // client-side now (FilterPanel is a multi-select; we no longer scope
  // the query by a single campaign slug). The volume per company is
  // bounded so paging is enough.
  const { data: rows = [] } = useQuery({
    queryKey: ["company-leads", { companyId }],
    queryFn: () => fetchCompanyLeads({ companyId }),
    enabled,
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet", companyId],
    queryFn: () => fetchWallet({ companyId }),
    enabled,
  });

  // Recent wallet transactions feed the right half of the wallet
  // header. Limit 8 (the feed renders the top 5 — buffer extras so
  // that pagination doesn't hit the request again on first scroll).
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["transactions", companyId],
    queryFn: () => fetchTransactions({ companyId, limit: 8 }),
    enabled,
  });

  const { data: companyCampaigns = [] } = useQuery({
    queryKey: ["company-campaigns", companyId, { search: "" }],
    queryFn: () => fetchCompanyCampaigns({ companyId }),
    enabled,
  });

  // Pre-populate the Campaign filter from `?campaign=<slug>` on first
  // render. Once the user opens the FilterPanel and toggles chips, the
  // panel becomes the canonical source — we don't keep mirroring the URL.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    if (!campaignSlugFromUrl) {
      hydratedRef.current = true;
      return;
    }
    if (companyCampaigns.length === 0) return;
    const match = companyCampaigns.find((c) => c.slug === campaignSlugFromUrl);
    if (match) {
      hydratedRef.current = true;
      setCampaignIds([match.id]);
    }
  }, [campaignSlugFromUrl, companyCampaigns]);

  // Partner options come from the rows themselves — only partners who
  // have actually submitted to this company show up. Sorted alphabetically.
  const partnerOptions = useMemo(() => {
    const seen = new Map();
    for (const row of rows) {
      if (row.partner && !seen.has(row.partner.id)) {
        seen.set(row.partner.id, {
          value: row.partner.id,
          label: `${row.partner.first_name} ${row.partner.last_name}`,
        });
      }
    }
    return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [rows]);

  const campaignOptions = useMemo(
    () => companyCampaigns.map((c) => ({ value: c.id, label: c.product_name })),
    [companyCampaigns],
  );

  // Filter sections fed to the shared FilterPanel.
  const filterSections = useMemo(
    () => [
      { key: "campaignIds", label: tFilter("campaign"), type: "chips", options: campaignOptions },
      { key: "partnerIds",  label: tFilter("partner"),  type: "chips", options: partnerOptions  },
    ],
    [campaignOptions, partnerOptions, tFilter],
  );

  const handlePanelApply = (next) => {
    if (Array.isArray(next.campaignIds)) setCampaignIds(next.campaignIds);
    if (Array.isArray(next.partnerIds))  setPartnerIds(next.partnerIds);
  };
  const handlePanelReset = () => {
    setCampaignIds([]);
    setPartnerIds([]);
  };
  const activeFilterCount = campaignIds.length + partnerIds.length;

  // Filter pipeline: search → campaign → partner → tab.
  const filtered = useMemo(() => {
    let r = rows;
    const q = search.trim().toLowerCase();
    if (q) {
      r = r.filter((row) => {
        const partnerName = row.partner
          ? `${row.partner.first_name} ${row.partner.last_name}`.toLowerCase()
          : "";
        const client = (row.client_full_name ?? "").toLowerCase();
        const product = (row.campaign?.product_name ?? "").toLowerCase();
        return partnerName.includes(q) || client.includes(q) || product.includes(q);
      });
    }
    if (campaignIds.length > 0) {
      const set = new Set(campaignIds);
      r = r.filter((row) => set.has(row.campaign?.id));
    }
    if (partnerIds.length > 0) {
      const set = new Set(partnerIds);
      r = r.filter((row) => set.has(row.partner?.id));
    }
    return r;
  }, [rows, search, campaignIds, partnerIds]);

  const { classified, counts } = useMemo(() => {
    const c = { all: filtered.length, awaitingReserve: 0, inWindow: 0, awaitingConfirm: 0, disputed: 0, closed: 0 };
    const byRow = new Map();
    if (now === null) return { classified: byRow, counts: c };
    for (const r of filtered) {
      const tab = classifyCompanyTab(r, now);
      byRow.set(r.id, tab);
      c[tab] = (c[tab] ?? 0) + 1;
    }
    return { classified: byRow, counts: c };
  }, [filtered, now]);

  // Sort + tab classification.
  const visibleRows = useMemo(() => {
    let r = activeTab === "all"
      ? filtered
      : filtered.filter((row) => classified.get(row.id) === activeTab);
    if (sort === "reservation_high") {
      r = [...r].sort((a, b) => (b.total_reservation ?? 0) - (a.total_reservation ?? 0));
    } else if (sort === "reservation_low") {
      r = [...r].sort((a, b) => (a.total_reservation ?? 0) - (b.total_reservation ?? 0));
    }
    // newest is the mock's default order — no client-side resort needed.
    return r;
  }, [filtered, classified, activeTab, sort]);

  const columns = useMemo(
    () =>
      buildCompanyLeadsInboxColumns({
        locale,
        tTable,
        tTime,
        tCells,
        available: wallet?.available_balance ?? null,
      }),
    [locale, tTable, tTime, tCells, wallet?.available_balance],
  );

  // Auto-open from ?open=<id> (closed-id-ref pattern, prevents reopen-on-close race).
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

  const handleRowClick = (row) => {
    setOpenRow(row);
    updateUrl({ campaign: campaignSlugFromUrl, openId: row.id });
  };
  const handleCloseOverlay = () => {
    closedIdRef.current = openRow?.id ? String(openRow.id) : null;
    setOpenRow(null);
    updateUrl({ campaign: campaignSlugFromUrl, openId: null });
  };

  // Shared invalidation set so all three flows refresh the same caches.
  const invalidateAfterMoneyMove = () => {
    queryClient.invalidateQueries({ queryKey: ["company-leads"] });
    queryClient.invalidateQueries({ queryKey: ["wallet"] });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["campaign"] });
  };

  const confirmSaleMutation = useMutation({
    mutationFn: ({ leadId }) => confirmSale(leadId),
    onSuccess: () => {
      invalidateAfterMoneyMove();
      toast.success(t("toast.confirmSaleSuccessBody"), {
        title: t("toast.confirmSaleSuccessTitle"),
      });
      setConfirmSaleTarget(null);
    },
    onError: () => {
      toast.error(t("toast.errorBody"), { title: t("toast.errorTitle") });
    },
  });

  const denyMutation = useMutation({
    mutationFn: ({ leadId, reason }) => denyConversion(leadId, { reason }),
    onSuccess: () => {
      invalidateAfterMoneyMove();
      toast.success(t("toast.denySuccessBody"), {
        title: t("toast.denySuccessTitle"),
      });
      setDenyTarget(null);
    },
    onError: () => {
      toast.error(t("toast.errorBody"), { title: t("toast.errorTitle") });
    },
  });

  const reserveMutation = useMutation({
    mutationFn: ({ leadId }) => acknowledgeLead(leadId),
    onSuccess: (_data, vars) => {
      // Stash the amount so the wallet header can flash a `-X` ghost
      // line in sync with its number tick. Cleared by the header after
      // its animation completes.
      setLastReservedAmount(vars.amount ?? null);
      queryClient.invalidateQueries({ queryKey: ["company-leads"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["campaign"] });
      // Auto-dismiss like other toasts (no `financial: true`) — the
      // wallet bar + ghost debit IS the persistent confirmation.
      toast.success(t("toast.reserveSuccessBody"), {
        title: t("toast.reserveSuccessTitle"),
      });
      setReserveTarget(null);
    },
    onError: (err) => {
      if (err?.code === "insufficient_funds") {
        toast.warning(t("toast.insufficientBody"), { title: t("toast.insufficientTitle") });
      } else {
        toast.error(t("toast.errorBody"), { title: t("toast.errorTitle") });
      }
    },
  });

  const renderActions = (row) => {
    const isActionable = row.status === "submitted" || row.status === "pending_escrow";
    if (!isActionable) return null;
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <AppButton
          size="sm"
          variant="accent"
          onClick={() => setReserveTarget(row)}
        >
          {t("actions.reserveAndView")}
        </AppButton>
      </div>
    );
  };

  // Active-filter chip helpers — small pills below the FilterBar with
  // X to remove individually. Mirrors the pattern in /applications.
  const activeCampaignChips = campaignIds
    .map((id) => companyCampaigns.find((c) => c.id === id))
    .filter(Boolean);
  const activePartnerChips = partnerIds
    .map((id) => partnerOptions.find((p) => p.value === id))
    .filter(Boolean);

  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[1.5em]">
      <PageHeader title={t("title")} description={t("description")} />

      <LeadInboxWalletHeader
        wallet={wallet}
        transactions={transactions}
        isLoadingTransactions={isLoadingTransactions}
        debitAmount={lastReservedAmount}
        onDebitAnimationDone={() => setLastReservedAmount(null)}
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("searchPlaceholder")}
        onFilterClick={() => setPanelOpen((v) => !v)}
        activeFilterCount={activeFilterCount}
        filterTriggerRef={filterTriggerRef}
        rightSlot={<LeadsInboxSort value={sort} onChange={setSort} />}
      />

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

      {(activeCampaignChips.length > 0 || activePartnerChips.length > 0) && (
        <div className="flex items-center flex-wrap gap-[0.5em]">
          <span className="text-[0.6875em] uppercase tracking-[0.06em] font-semibold text-text-muted shrink-0">
            {t("filteredBy")}
          </span>
          {activeCampaignChips.map((c) => (
            <ActiveChip
              key={`c-${c.id}`}
              label={c.product_name}
              onRemove={() =>
                setCampaignIds((prev) => prev.filter((id) => id !== c.id))
              }
            />
          ))}
          {activePartnerChips.map((p) => (
            <ActiveChip
              key={`p-${p.value}`}
              label={p.label}
              onRemove={() =>
                setPartnerIds((prev) => prev.filter((id) => id !== p.value))
              }
            />
          ))}
        </div>
      )}

      {visibleRows.length === 0 ? (
        <div className="bg-surface border border-border-light rounded-[0.625em] shadow-xs">
          <CompanyLeadsInboxEmptyState tab={activeTab} t={t} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={visibleRows}
          onRowClick={handleRowClick}
          actions={renderActions}
          actionsWidth="9em"
          pageSize={10}
        />
      )}

      <FilterPanel
        triggerRef={filterTriggerRef}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onApply={handlePanelApply}
        onReset={handlePanelReset}
        sections={filterSections}
        activeCount={activeFilterCount}
        initialValues={{ campaignIds, partnerIds }}
      />

      <ReserveConfirmDialog
        open={!!reserveTarget}
        lead={reserveTarget}
        available={wallet?.available_balance ?? 0}
        isPending={reserveMutation.isPending}
        onCancel={() => setReserveTarget(null)}
        onConfirm={() =>
          reserveMutation.mutate({
            leadId: reserveTarget.id,
            amount: reserveTarget.total_reservation,
          })
        }
      />

      {/* Derive the overlay's `lead` from the live `rows` cache (keyed
          by openRow.id) so a successful Reserve & view automatically
          flips the overlay from masked → revealed without forcing the
          user to close + reopen. Falls back to the local snapshot if
          the row hasn't yet appeared in the latest fetch. */}
      <CompanyLeadDetailOverlay
        open={!!openRow}
        onClose={handleCloseOverlay}
        lead={openRow ? rows.find((r) => r.id === openRow.id) ?? openRow : null}
        onReserveClick={(row) => setReserveTarget(row)}
        onConfirmSaleClick={(row) => setConfirmSaleTarget(row)}
        onDenyConversionClick={(row) => setDenyTarget(row)}
      />

      <ConfirmSaleDialog
        open={!!confirmSaleTarget}
        lead={confirmSaleTarget}
        isPending={confirmSaleMutation.isPending}
        onCancel={() => setConfirmSaleTarget(null)}
        onConfirm={() =>
          confirmSaleMutation.mutate({ leadId: confirmSaleTarget.id })
        }
      />

      <DenyConversionDialog
        open={!!denyTarget}
        lead={denyTarget}
        isPending={denyMutation.isPending}
        onCancel={() => setDenyTarget(null)}
        onConfirm={(reason) =>
          denyMutation.mutate({ leadId: denyTarget.id, reason })
        }
      />
    </div>
  );
}

function ActiveChip({ label, onRemove }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-[0.375em] h-[1.875em] pl-[0.75em] pr-[0.5em] rounded-full bg-accent-light text-accent-text text-[0.75em] font-semibold hover:bg-accent/15 transition-[background-color] duration-150 ease-out"
    >
      <span>{label}</span>
      <FiX size="0.75em" strokeWidth={2.5} />
    </button>
  );
}
