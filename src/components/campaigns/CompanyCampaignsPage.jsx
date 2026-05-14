"use client";

/**
 * CompanyCampaignsPage — /campaigns (company role).
 *
 * Mirrors the partner-facing /marketplace's structural choices so the two
 * sides feel consistent:
 *   PageHeader (title + description + Create-new-campaign action slot)
 *   FilterBar  (live search + Filters trigger placeholder OR none for now)
 *   StatusTabs (All · Active · Paused · Draft · Closed) with live counts
 *   <Grid of CompanyCampaignCard>
 *
 * State this page owns:
 *   - search    : string
 *   - statusKey : "all" | "active" | "paused" | "draft" | "closed"
 *   - sort      : "newest" | "most_leads" | "highest_conversion"
 *
 * Two parallel queries:
 *   - the FILTERED list (for the grid + empty state) — keys on the full
 *     filter shape so React Query refetches as filters change.
 *   - the UNFILTERED list (for the StatusTabs counts) — keys only on
 *     companyId so the count chips stay stable as the user clicks chips.
 *
 * Verification gate: the "Create new campaign" button is disabled with
 * tooltip when `user.application_status !== "approved"` OR
 * `user.is_email_verified === false`. Per-row Pause/Resume/Close also
 * disabled via CompanyCampaignCard's `actionsDisabled` prop. Edit stays
 * clickable so the company can keep prepping a draft while pending review.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { FiLayers, FiPlayCircle, FiPauseCircle, FiEdit3, FiArchive } from "react-icons/fi";
import { useAuth } from "@/components/providers/AuthProvider";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/shared/layout/PageHeader";
import FilterBar from "@/components/shared/layout/FilterBar";
import StatusTabs from "@/components/shared/data-display/StatusTabs";
import EmptyState from "@/components/shared/feedback/EmptyState";
import { fetchCompanyCampaigns } from "@/lib/mock/campaigns";
import { cn } from "@/lib/utils";
import CompanyCampaignCard from "./CompanyCampaignCard";

const STATUS_KEYS = ["all", "active", "paused", "draft", "closed"];

// Per-tab icon mapping — same `react-icons/fi` set the partner-side
// /applications page uses, so the two pages feel visually consistent.
// Tab semantics drive the icon: "all" = layered stack, "active" = play,
// "paused" = pause, "draft" = edit/pencil, "closed" = archive.
const STATUS_ICONS = {
  all:    FiLayers,
  active: FiPlayCircle,
  paused: FiPauseCircle,
  draft:  FiEdit3,
  closed: FiArchive,
};

/** Map a tab key to the statuses[] arg fetchCompanyCampaigns expects. */
function statusesForTab(tabKey) {
  if (tabKey === "all") return undefined; // mock returns all four when undefined
  return [tabKey];
}

export default function CompanyCampaignsPage() {
  const t = useTranslations("Campaigns.companyList");
  const { user } = useAuth();
  const companyId = user?.profile?.id ?? user?.id;

  const [search, setSearch] = useState("");
  const [statusKey, setStatusKey] = useState("all");
  // Sort is locked to "newest" for v1. The hook + mock already accept the
  // other two sorts (most_leads, highest_conversion); a sort popover lands
  // when the company has enough campaigns to warrant it.
  const sort = "newest";

  // Filtered list — what the grid renders.
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["company-campaigns", companyId, { search, statusKey, sort }],
    queryFn: () =>
      fetchCompanyCampaigns({
        companyId,
        statuses: statusesForTab(statusKey),
        search,
        sort,
      }),
    enabled: !!companyId,
  });

  // Unfiltered (search-respecting) list — used to compute StatusTabs counts.
  // We respect search so the counts shrink as the user narrows the page,
  // but we ignore the active status tab so each chip's count is independent
  // of which one is selected.
  const { data: forCounts = [] } = useQuery({
    queryKey: ["company-campaigns-counts", companyId, { search }],
    queryFn: () => fetchCompanyCampaigns({ companyId, search }),
    enabled: !!companyId,
  });

  const counts = useMemo(() => {
    const c = { all: forCounts.length, active: 0, paused: 0, draft: 0, closed: 0 };
    for (const row of forCounts) {
      if (c[row.status] !== undefined) c[row.status]++;
    }
    return c;
  }, [forCounts]);

  const isApproved = user?.application_status === "approved";
  const isEmailVerified = !!user?.is_email_verified;
  const canCreate = isApproved && isEmailVerified;

  const gateReason = !isApproved
    ? t("createGate.pendingReview")
    : !isEmailVerified
    ? t("createGate.emailUnverified")
    : null;

  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[1.5em]">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <CreateCampaignAction canCreate={canCreate} reason={gateReason} label={t("createCta")} />
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("searchPlaceholder")}
      />

      <StatusTabs
        tabs={STATUS_KEYS.map((key) => ({
          key,
          label: t(`tabs.${key}`),
          icon: STATUS_ICONS[key],
        }))}
        activeKey={statusKey}
        onChange={setStatusKey}
        counts={counts}
      />

      {isLoading ? (
        <Skeleton />
      ) : campaigns.length === 0 ? (
        <EmptyBranch statusKey={statusKey} hasAnyCampaigns={counts.all > 0} canCreate={canCreate} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1em]">
          {campaigns.map((c) => (
            <CompanyCampaignCard
              key={c.id}
              campaign={c}
              actionsDisabled={!canCreate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Create-campaign CTA + verification gate ───────────────────────── */

function CreateCampaignAction({ canCreate, reason, label }) {
  const sharedClass = cn(
    "inline-flex items-center gap-[0.5em] h-[2.5em] px-[1.125em] rounded-[0.5em]",
    "text-[0.8125em] font-semibold tracking-[-0.005em]",
    "bg-cta text-cta-text shadow-sm",
    "transition-[background-color,box-shadow,transform,opacity] duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
  );

  if (!canCreate) {
    return (
      <span title={reason} className={cn(sharedClass, "opacity-50 cursor-not-allowed")}>
        <Plus size="1em" strokeWidth={2.25} />
        {label}
      </span>
    );
  }
  return (
    <Link
      href="/campaigns/new"
      className={cn(sharedClass, "hover:bg-cta-hover hover:shadow-md hover:-translate-y-[1px] active:translate-y-0")}
    >
      <Plus size="1em" strokeWidth={2.25} />
      {label}
    </Link>
  );
}

/* ── Empty branches ─────────────────────────────────────────────────── */

function EmptyBranch({ statusKey, hasAnyCampaigns, canCreate }) {
  const t = useTranslations("Campaigns.companyList.empty");
  // First-time-ever empty: the company has zero campaigns at all → big
  // "Publish your first campaign" CTA. Filtered-empty (they have campaigns
  // but none in this tab) → smaller, neutral state.
  if (!hasAnyCampaigns) {
    return (
      <div className="bg-surface border border-border-light rounded-[0.75em]">
        <EmptyState
          icon={<Plus />}
          title={t("firstTitle")}
          subtitle={t("firstBody")}
          action={
            canCreate ? (
              <Link
                href="/campaigns/new"
                className="inline-flex items-center gap-[0.5em] h-[2.5em] px-[1.125em] rounded-[0.5em] bg-cta text-cta-text text-[0.8125em] font-semibold shadow-sm hover:bg-cta-hover hover:shadow-md hover:-translate-y-[1px] transition-[background-color,box-shadow,transform] duration-150 ease-out"
              >
                <Plus size="1em" strokeWidth={2.25} />
                {t("firstCta")}
              </Link>
            ) : null
          }
        />
      </div>
    );
  }
  return (
    <div className="bg-surface border border-border-light rounded-[0.75em]">
      <EmptyState
        title={t(`filtered.${statusKey}.title`)}
        subtitle={t(`filtered.${statusKey}.body`)}
      />
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1em]">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-[18em] bg-surface border border-border-light rounded-[0.75em] shadow-xs p-[1.25em] flex flex-col gap-[0.875em]"
        >
          <div className="w-full aspect-[16/9] rounded-[0.5em] bg-bg-alt" />
          <span className="block h-[0.625em] w-[40%] rounded-[0.25em] bg-bg-alt" />
          <span className="block h-[1em] w-[80%] rounded-[0.25em] bg-bg-alt" />
          <span className="block h-[0.625em] w-full rounded-[0.25em] bg-bg-alt" />
          <div className="flex-1" />
          <div className="flex items-center justify-between pt-[0.75em] border-t border-border-light">
            <span className="block h-[0.875em] w-[5em] rounded-[0.25em] bg-bg-alt" />
            <span className="block h-[1.25em] w-[4em] rounded-full bg-bg-alt" />
          </div>
        </div>
      ))}
    </div>
  );
}
