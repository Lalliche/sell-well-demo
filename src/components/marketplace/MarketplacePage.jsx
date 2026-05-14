"use client";

/**
 * MarketplacePage — Sales Partner discovery feed of campaigns.
 *
 * Layout:
 *   PageHeader (title + description)
 *   FilterBar
 *     - search (live)
 *     - inline chips for commission_type (All / Percentage / Flat)
 *     - Filters button (opens FilterPanel for Category multi-select +
 *       Partner Links toggle)
 *     - sort dropdown in the right slot
 *   <Grid of MarketplaceCard>
 *
 * State this component owns:
 *   - search, commissionType, categoryIds[], partnerLinksEnabled (filter)
 *   - sort
 *   - panelOpen (FilterPanel visibility)
 *
 * Data: a single useQuery with the assembled filter shape as the cache
 * key. React Query handles re-fetching as filters change.
 */

import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/components/providers/AuthProvider";
import PageHeader from "@/components/shared/layout/PageHeader";
import FilterBar from "@/components/shared/layout/FilterBar";
import FilterPanel from "@/components/shared/overlays/FilterPanel";
import StatusTabs from "@/components/shared/data-display/StatusTabs";
import { fetchMarketplace } from "@/lib/mock/marketplace";
import { fetchCategories } from "@/lib/mock/campaigns";
import MarketplaceCard from "./MarketplaceCard";
import MarketplaceSort from "./MarketplaceSort";
import MarketplaceGate, { useMarketplaceGate } from "./MarketplaceGate";

// Primary chip strip — application status. Default chip is "unapplied"
// so a partner opening the marketplace immediately sees only what's new
// to them. Per the marketplace-listing-pattern research: real platforms
// show all items mixed with status badges; we let the partner pick.
const APPLICATION_STATUS_CHIPS = ["all", "unapplied", "pending", "approved", "rejected"];

export default function MarketplacePage() {
  const t = useTranslations("Marketplace");
  const tFilter = useTranslations("Marketplace.filter");
  const locale = useLocale();
  const { user } = useAuth();
  const userId = user?.id;

  // Verification gate — sales partners under admin review (or with an
  // unverified email) hit a hard guard. Gate renders in place of the
  // marketplace content area; sidebar + top header chrome stay visible
  // (they're owned by DashboardShell). Companies + admins always pass.
  const gate = useMarketplaceGate(user);

  const [search, setSearch] = useState("");
  const [applicationChip, setApplicationChip] = useState("unapplied"); // "all" | "unapplied" | "pending" | "approved" | "rejected"
  const [sort, setSort] = useState("newest");
  const [categoryIds, setCategoryIds] = useState([]);
  const [commissionType, setCommissionType] = useState(null); // null | "percentage" | "flat"
  const [partnerLinksEnabled, setPartnerLinksEnabled] = useState(null); // null | true | false
  const [panelOpen, setPanelOpen] = useState(false);
  const filterTriggerRef = useRef(null);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: [
      "marketplace",
      { userId, search, applicationStatus: applicationChip, commissionType, categoryIds, partnerLinksEnabled, sort },
    ],
    queryFn: () =>
      fetchMarketplace({
        userId,
        search,
        applicationStatus: applicationChip,
        commissionType,
        categoryIds,
        partnerLinksEnabled,
        sort,
      }),
    enabled: !!userId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const activeFilterCount =
    categoryIds.length +
    (commissionType !== null ? 1 : 0) +
    (partnerLinksEnabled !== null ? 1 : 0);

  const filterSections = useMemo(
    () => [
      {
        key: "categoryIds",
        label: tFilter("category"),
        type: "chips",
        options: categories.map((c) => ({
          value: c.id,
          label: locale === "fr" ? c.name_fr : c.name_en,
        })),
      },
      {
        key: "commissionType",
        label: tFilter("commissionType"),
        type: "chips",
        options: [
          { value: "percentage", label: tFilter("commission.percentage") },
          { value: "flat",       label: tFilter("commission.flat") },
        ],
      },
      {
        key: "partnerLinksEnabled",
        label: tFilter("partnerLinks"),
        type: "chips",
        options: [
          { value: "true",  label: tFilter("partnerLinksYes") },
          { value: "false", label: tFilter("partnerLinksNo")  },
        ],
      },
    ],
    [categories, locale, tFilter],
  );

  // The FilterPanel models everything as `chips` (multi-select arrays);
  // Commission type and Partner Links are single-pick, so we coerce on apply.
  const handlePanelApply = (next) => {
    if (Array.isArray(next.categoryIds)) {
      setCategoryIds(next.categoryIds);
    }
    if (Array.isArray(next.commissionType)) {
      const arr = next.commissionType;
      if (arr.length === 1) setCommissionType(arr[0]);
      else setCommissionType(null);
    }
    if (Array.isArray(next.partnerLinksEnabled)) {
      const arr = next.partnerLinksEnabled;
      // Mutually exclusive: if both are picked, treat as null. If exactly
      // one, treat as that boolean. Empty → null.
      if (arr.length === 1) setPartnerLinksEnabled(arr[0] === "true");
      else setPartnerLinksEnabled(null);
    }
  };

  const handlePanelReset = () => {
    setCategoryIds([]);
    setCommissionType(null);
    setPartnerLinksEnabled(null);
  };

  // When the gate is active, swap the entire content area (filter bar +
  // grid) for the guard. The PageHeader stays so the user keeps context
  // about which page they're on. Sidebar + top header are owned by
  // DashboardShell, untouched.
  if (gate) {
    return (
      <div className="px-[2em] py-[2em] flex flex-col gap-[1.5em]">
        <PageHeader title={t("title")} description={t("description")} />
        <MarketplaceGate variant={gate} />
      </div>
    );
  }

  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[1.5em]">
      <PageHeader title={t("title")} description={t("description")} />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("searchPlaceholder")}
        onFilterClick={() => setPanelOpen((v) => !v)}
        activeFilterCount={activeFilterCount}
        filterTriggerRef={filterTriggerRef}
        rightSlot={<MarketplaceSort value={sort} onChange={setSort} />}
      />

      <StatusTabs
        tabs={APPLICATION_STATUS_CHIPS.map((key) => ({
          key,
          label: tFilter(`application.${key}`),
        }))}
        activeKey={applicationChip}
        onChange={setApplicationChip}
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
          categoryIds,
          commissionType: commissionType === null ? [] : [commissionType],
          partnerLinksEnabled:
            partnerLinksEnabled === null ? [] : [String(partnerLinksEnabled)],
        }}
      />

      {isLoading ? (
        <Skeleton />
      ) : campaigns.length === 0 ? (
        <Empty />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1em]">
          {campaigns.map((c) => (
            <MarketplaceCard key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function Empty() {
  const t = useTranslations("Marketplace.empty");
  return (
    <div className="flex flex-col items-center text-center gap-[0.5em] py-[4em] bg-surface border border-border-light rounded-[0.75em]">
      <span className="text-[1em] font-semibold text-text">{t("title")}</span>
      <span className="text-[0.8125em] text-text-muted leading-[1.5] max-w-[28em]">
        {t("body")}
      </span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1em]">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-[14em] bg-surface border border-border-light rounded-[0.75em] shadow-xs p-[1.25em] flex flex-col gap-[0.875em]">
          <div className="flex items-center gap-[0.625em]">
            <span className="w-[2em] h-[2em] rounded-[0.375em] bg-bg-alt" />
            <div className="flex-1 flex flex-col gap-[0.375em]">
              <span className="block h-[0.625em] w-[60%] rounded-[0.25em] bg-bg-alt" />
              <span className="block h-[0.5em]  w-[40%] rounded-[0.25em] bg-bg-alt" />
            </div>
          </div>
          <span className="block h-[1em] w-[80%] rounded-[0.25em] bg-bg-alt" />
          <span className="block h-[0.625em] w-full rounded-[0.25em] bg-bg-alt" />
          <span className="block h-[0.625em] w-[85%] rounded-[0.25em] bg-bg-alt" />
          <div className="flex-1" />
          <div className="flex items-center justify-between pt-[0.75em] border-t border-border-light">
            <span className="block h-[0.875em] w-[5em] rounded-[0.25em] bg-bg-alt" />
            <span className="block h-[1em] w-[4em] rounded-full bg-bg-alt" />
          </div>
        </div>
      ))}
    </div>
  );
}
