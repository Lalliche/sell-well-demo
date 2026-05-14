"use client";

/**
 * Active campaigns — right column of the dashboard's secondary row.
 *
 * Lists the company's own campaigns (any status) with: product name,
 * StatusBadge, partner count + lead count line, and an inline arrow to
 * /campaigns/[slug].
 *
 * Counts are computed from the same data the parent already pulled (leads
 * + applications), so we don't fire extra queries — this component is
 * purely presentational.
 *
 * Empty state nudges the company to publish their first campaign.
 */

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Plus } from "lucide-react";
import StatusBadge from "@/components/shared/data-display/StatusBadge";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 5;

/** Build a per-campaign rollup from the leads + applications already
 *  loaded by the parent. Used both for the row metadata strip and for
 *  the empty/non-empty branch decision. */
function buildRollups({ campaigns, leads, applications }) {
  if (!campaigns) return [];
  return campaigns.map((c) => {
    const partnerIds = new Set(
      (applications ?? [])
        .filter((a) => a.campaign?.id === c.id && a.status === "approved")
        .map((a) => a.partner.id),
    );
    const campaignLeads = (leads ?? []).filter((l) => l.campaign === c.id);
    return {
      id: c.id,
      slug: c.slug,
      product_name: c.product_name,
      status: c.status,
      partnerCount: partnerIds.size,
      leadCount: campaignLeads.length,
    };
  });
}

export default function ActiveCampaignsList({
  campaigns,
  leads,
  applications,
  isLoading,
}) {
  const t = useTranslations("Dashboard.CompanyDashboard.activeCampaigns");
  const rows = useMemo(
    () => buildRollups({ campaigns, leads, applications }),
    [campaigns, leads, applications],
  );

  // Sort: active first, then paused, then draft, then closed. Within a
  // group, newest activity first (proxy: highest lead count).
  const sorted = useMemo(() => {
    const order = { active: 0, paused: 1, draft: 2, closed: 3 };
    return [...rows].sort((a, b) => {
      const oa = order[a.status] ?? 99;
      const ob = order[b.status] ?? 99;
      if (oa !== ob) return oa - ob;
      return b.leadCount - a.leadCount;
    });
  }, [rows]);

  return (
    <div className="w-full h-full bg-surface border border-border-light rounded-[0.75em] shadow-xs flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-[0.5em] px-[1.125em] pt-[1em] pb-[0.75em] border-b border-border-light">
        <span className="text-[0.6875em] uppercase tracking-[0.08em] text-text-muted font-semibold">
          {t("title")}
        </span>
        <Link
          href="/campaigns"
          className="text-[0.75em] font-semibold text-accent-text hover:underline"
        >
          {t("viewAll")}
        </Link>
      </div>

      {sorted.length === 0 ? (
        <Empty />
      ) : (
        <ul className="flex flex-col divide-y divide-border-light">
          {sorted.slice(0, PAGE_SIZE).map((c) => (
            <li key={c.id}>
              <CampaignRow campaign={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CampaignRow({ campaign }) {
  const t = useTranslations("Dashboard.CompanyDashboard.activeCampaigns");
  return (
    <Link
      href={`/campaigns/${campaign.slug}`}
      className={cn(
        "group flex items-center gap-[0.625em] px-[1.125em] py-[0.875em]",
        "hover:bg-bg-alt transition-[background-color] duration-150 ease-out",
        "focus-visible:outline-none focus-visible:bg-bg-alt",
      )}
    >
      <div className="flex-1 min-w-0 flex flex-col gap-[0.125em]">
        <span className="text-[0.875em] font-semibold text-text truncate transition-colors duration-150 ease-out group-hover:text-accent-text">
          {campaign.product_name}
        </span>
        <span className="text-[0.75em] text-text-muted truncate">
          {t("metaLine", {
            partners: campaign.partnerCount,
            leads: campaign.leadCount,
          })}
        </span>
      </div>
      <div className="shrink-0 flex items-center gap-[0.375em]">
        <StatusBadge status={campaign.status} />
        <ArrowRight
          size="0.875em"
          strokeWidth={2}
          className="text-text-muted transition-transform duration-150 ease-out group-hover:translate-x-[0.125em] group-hover:text-text-secondary"
        />
      </div>
    </Link>
  );
}

function Empty() {
  const t = useTranslations("Dashboard.CompanyDashboard.activeCampaigns.empty");
  return (
    <div className="flex flex-col items-center text-center gap-[0.5em] px-[1em] py-[2em]">
      <span
        aria-hidden="true"
        className="inline-flex items-center justify-center w-[2.25em] h-[2.25em] rounded-full bg-accent-light text-accent-text"
      >
        <Plus size="1em" strokeWidth={1.75} />
      </span>
      <span className="text-[0.875em] font-medium text-text">{t("title")}</span>
      <span className="text-[0.75em] text-text-muted leading-[1.5] max-w-[20em]">
        {t("body")}
      </span>
      <Link
        href="/campaigns/new"
        className="mt-[0.375em] text-[0.75em] font-semibold text-accent-text hover:underline"
      >
        {t("cta")}
      </Link>
    </div>
  );
}

function Skeleton() {
  return (
    <ul className="flex flex-col divide-y divide-border-light">
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex items-center gap-[0.625em] px-[1.125em] py-[0.875em]">
          <div className="flex-1 flex flex-col gap-[0.375em]">
            <span className="block h-[0.75em] w-[60%] rounded-[0.25em] bg-bg-alt" />
            <span className="block h-[0.625em] w-[40%] rounded-[0.25em] bg-bg-alt" />
          </div>
          <span className="block h-[1.25em] w-[4em] rounded-full bg-bg-alt" />
        </li>
      ))}
    </ul>
  );
}
