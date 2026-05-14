"use client";

/**
 * CampaignPartnerBreakdownOverlay — opened when a row in the company
 * /partner-links/performance table is clicked. Shows a per-partner
 * breakdown for that one campaign.
 *
 * Sidebar order (per the business-logic spec):
 *   1. Summary       → 4 KPI tiles + per-partner table (the "what")
 *   2. Link Health   → triage of broken/dormant partners (the "what's broken")
 *   3. Daily Pulse   → 14-day sparklines (the "where it's heading")
 *
 * The per-partner table is built on the project-wide `DataTable`
 * primitive — same sort/pagination/empty UX every other table in the
 * project. The Link column uses the shared `CopyPill` primitive.
 */

import Image from "next/image";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Users, Activity } from "lucide-react";
import DetailOverlay from "@/components/shared/overlays/DetailOverlay";
import DataTable from "@/components/shared/data-display/DataTable";
import CopyPill from "@/components/shared/forms/CopyPill";
import { fetchCampaignPartnerLinkBreakdown } from "@/lib/mock/company-stats";
import { format as formatDZD, formatNumber } from "@/lib/format/currency";
import { cn } from "@/lib/utils";
import CampaignDailyPulseSection from "./CampaignDailyPulseSection";

export default function CampaignPartnerBreakdownOverlay({
  open,
  onClose,
  campaign,
  sinceISO,
}) {
  const t = useTranslations("PartnerLinksPerf.breakdown");
  const tCopy = useTranslations("PartnerLinks.copy");
  const campaignId = campaign?.campaign_id ?? null;

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["campaign-partner-breakdown", campaignId, sinceISO],
    queryFn: () =>
      fetchCampaignPartnerLinkBreakdown({ campaignId, sinceISO }),
    enabled: open && !!campaignId,
  });

  const sections = [
    {
      key: "summary",
      label: t("section.summary"),
      icon: <Users className="w-[1em] h-[1em]" strokeWidth={1.5} />,
      content: (
        <SummarySection
          campaign={campaign}
          rows={rows}
          isLoading={isLoading}
          t={t}
          tCopy={tCopy}
        />
      ),
    },
    {
      key: "pulse",
      label: t("section.pulse"),
      icon: <Activity className="w-[1em] h-[1em]" strokeWidth={1.5} />,
      content: (
        <CampaignDailyPulseSection campaignId={campaignId} isVisible={open} />
      ),
    },
  ];

  return (
    <DetailOverlay
      open={open}
      onClose={onClose}
      title={campaign?.campaign_name ?? "—"}
      subtitle={t("subtitle", { count: rows.length })}
      sections={sections}
    />
  );
}

function SummarySection({ campaign, rows, isLoading, t, tCopy }) {
  const conversionRate =
    campaign?.clicks
      ? Math.round((campaign.conversions / campaign.clicks) * 1000) / 10
      : 0;

  const columns = useMemo(
    () => [
      {
        key: "partner_name",
        label: t("table.col.partner"),
        sortable: true,
        width: "30%",
        render: (_v, row) => (
          <div className="flex items-center gap-[0.5em] min-w-0">
            {row.partner_photo ? (
              <Image
                src={row.partner_photo}
                alt={row.partner_name}
                width={28}
                height={28}
                unoptimized
                className="w-[1.75em] h-[1.75em] rounded-full object-cover shrink-0"
              />
            ) : (
              <span className="w-[1.75em] h-[1.75em] rounded-full bg-bg-alt shrink-0" />
            )}
            <span className="text-[0.875em] font-semibold text-text truncate">
              {row.partner_name}
            </span>
          </div>
        ),
      },
      {
        key: "link_url",
        label: t("table.col.link"),
        width: "26%",
        render: (_v, row) => (
          <span onClick={(e) => e.stopPropagation()}>
            <CopyPill
              value={row.link_url}
              displayValue={`/r/${row.link_code}`}
              size="sm"
              labels={{
                copy: tCopy("copy"),
                copied: tCopy("copied"),
                toastSuccess: tCopy("toastSuccess"),
              }}
            />
          </span>
        ),
      },
      {
        key: "clicks",
        label: t("table.col.clicks"),
        sortable: true,
        align: "right",
        width: "10%",
        render: (v) => <Mono>{formatNumber(v)}</Mono>,
      },
      {
        key: "conversions",
        label: t("table.col.conversions"),
        sortable: true,
        align: "right",
        width: "12%",
        render: (v) => <Mono>{formatNumber(v)}</Mono>,
      },
      {
        key: "commissions_paid",
        label: t("table.col.commission"),
        sortable: true,
        align: "right",
        width: "20%",
        render: (v) => <Mono accent>{formatDZD(v)}</Mono>,
      },
    ],
    [t, tCopy],
  );

  return (
    <div className="flex flex-col gap-[1.25em]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[0.75em]">
        <Tile label={t("totals.clicks")} value={formatNumber(campaign?.clicks ?? 0)} />
        <Tile label={t("totals.conversions")} value={formatNumber(campaign?.conversions ?? 0)} />
        <Tile label={t("totals.conversionRate")} value={`${conversionRate}%`} />
        <Tile
          label={t("totals.commissionsPaid")}
          value={formatDZD(campaign?.commissions_paid ?? 0)}
          highlight
        />
      </div>

      <div className="flex flex-col gap-[0.5em]">
        <span className="text-[0.6875em] font-semibold tracking-[0.06em] uppercase text-text-muted px-[0.25em]">
          {t("table.title")}
        </span>
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(row) => row.link_id}
          isLoading={isLoading}
          pageSize={10}
          emptyTitle={t("empty.title")}
          emptySubtitle={t("empty.body")}
        />
      </div>
    </div>
  );
}

function Tile({ label, value, highlight }) {
  return (
    <div className="flex flex-col gap-[0.25em] p-[0.875em] rounded-[0.5em] bg-surface border border-border-light">
      <span className="text-[0.625em] font-semibold tracking-[0.06em] uppercase text-text-muted">
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-[1em] font-semibold tabular-nums",
          highlight ? "text-accent-text" : "text-text",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function Mono({ children, accent }) {
  return (
    <span
      className={cn(
        "font-mono tabular-nums text-text",
        accent && "text-accent-text font-semibold",
      )}
    >
      {children}
    </span>
  );
}
