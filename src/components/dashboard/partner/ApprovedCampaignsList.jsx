"use client";

/**
 * Approved campaigns — bottom of the right column in the activity zone.
 *
 * Lists the campaigns where the partner is APPROVED (per their
 * CampaignApplication.status). Each row shows: product name, company
 * (resolved from the campaigns seed), commission terms (pretty-printed).
 *
 * Two quick actions per row: "Submit lead" (always) and "Generate link"
 * (only when campaign.partner_links_enabled). Routes to the destinations
 * Phase 6 will wire up.
 */

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Plus, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format as formatDZD } from "@/lib/format/currency";
import { MOCK_COMPANY_PROFILES } from "@/lib/mock/_seed/company-profiles";

function companyNameFor(campaign) {
  const c = MOCK_COMPANY_PROFILES.find((co) => co.id === campaign.company);
  return c?.company_name ?? "—";
}

function commissionLabel(campaign, t) {
  if (campaign.commission_type === "percentage") {
    return t("pctCommission", { value: campaign.commission_value });
  }
  return t("flatCommission", { value: formatDZD(campaign.commission_value) });
}

export default function ApprovedCampaignsList({ campaigns, isLoading }) {
  const t = useTranslations("Dashboard.PartnerDashboard.approvedCampaigns");

  return (
    <div className="w-full h-full bg-surface border border-border-light rounded-[0.75em] shadow-xs flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-[0.5em] px-[1.125em] pt-[1em] pb-[0.75em] border-b border-border-light">
        <span className="text-[0.6875em] uppercase tracking-[0.08em] text-text-muted font-semibold">
          {t("title")}
        </span>
        <Link
          href="/applications"
          className="text-[0.75em] font-semibold text-accent-text hover:underline"
        >
          {t("viewAll")}
        </Link>
      </div>

      {isLoading ? (
        <Skeleton />
      ) : !campaigns || campaigns.length === 0 ? (
        <Empty />
      ) : (
        <ul className="flex flex-col divide-y divide-border-light">
          {campaigns.map((c) => (
            <li key={c.id}>
              <Row campaign={c} commissionLabel={commissionLabel(c, t)} t={t} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({ campaign, commissionLabel, t }) {
  return (
    <div className="flex items-start gap-[0.625em] px-[1.125em] py-[0.875em]">
      <div className="flex-1 min-w-0 flex flex-col gap-[0.125em]">
        <span className="text-[0.875em] font-semibold text-text truncate">
          {campaign.product_name}
        </span>
        <span className="text-[0.75em] text-text-muted truncate">
          {companyNameFor(campaign)} · {commissionLabel}
        </span>
      </div>
      <div className="shrink-0 flex items-center gap-[0.25em]">
        <Link
          href="/leads/new"
          aria-label={t("submitLead")}
          title={t("submitLead")}
          className={cn(
            "inline-flex items-center justify-center w-[1.875em] h-[1.875em] rounded-[0.375em]",
            "text-text-secondary hover:bg-bg-alt hover:text-text",
            "transition-[background-color,color] duration-150 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
          )}
        >
          <Plus size="0.875em" strokeWidth={2} />
        </Link>
        {campaign.partner_links_enabled && (
          <Link
            href="/partner-links"
            aria-label={t("generateLink")}
            title={t("generateLink")}
            className={cn(
              "inline-flex items-center justify-center w-[1.875em] h-[1.875em] rounded-[0.375em]",
              "text-text-secondary hover:bg-bg-alt hover:text-text",
              "transition-[background-color,color] duration-150 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
            )}
          >
            <Link2 size="0.875em" strokeWidth={1.75} />
          </Link>
        )}
      </div>
    </div>
  );
}

function Empty() {
  const t = useTranslations("Dashboard.PartnerDashboard.approvedCampaigns.empty");
  return (
    <div className="flex flex-col items-center text-center gap-[0.375em] px-[1em] py-[2em]">
      <span className="text-[0.875em] font-medium text-text">{t("title")}</span>
      <span className="text-[0.75em] text-text-muted leading-[1.5] max-w-[20em]">
        {t("body")}
      </span>
      <Link
        href="/marketplace"
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
        <li key={i} className="flex items-start gap-[0.625em] px-[1.125em] py-[0.875em]">
          <div className="flex-1 flex flex-col gap-[0.375em]">
            <span className="block h-[0.75em] w-[60%] rounded-[0.25em] bg-bg-alt" />
            <span className="block h-[0.625em] w-[80%] rounded-[0.25em] bg-bg-alt" />
          </div>
        </li>
      ))}
    </ul>
  );
}
