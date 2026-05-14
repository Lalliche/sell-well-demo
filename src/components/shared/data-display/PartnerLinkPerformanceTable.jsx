"use client";

/**
 * PartnerLinkPerformanceTable — shared per-campaign Partner Link rollup
 * table. Thin wrapper over the project-wide `DataTable` primitive.
 *
 * Two consumers today:
 *   - /dashboard (company)            → preview rollup, no row click,
 *                                       campaign cell is a Link to detail
 *   - /partner-links/performance      → full page, row click opens the
 *                                       per-campaign overlay (campaign
 *                                       cell is plain text, the row
 *                                       itself is the click target)
 *
 * Columns: Campaign · Clicks · Conversions · Conv rate · Commissions paid.
 * Revenue intentionally dropped — on Partner Links the merchant runs
 * their own checkout, so "revenue" is whatever Chargily's webhook
 * reports as the gross sale amount. From the company's perspective the
 * meaningful number is the commission they owe, not the merchant's
 * topline. We keep `revenue` on the row shape (the mock returns it)
 * but don't surface it.
 *
 * Required `t` keys:
 *   title, viewAll, col.{campaign, clicks, conversions, conversionRate,
 *   commissionsPaid}, empty.{title, body, cta}
 */

import { useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Link2 } from "lucide-react";
import DataTable from "./DataTable";
import { format as formatDZD, formatNumber } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

export default function PartnerLinkPerformanceTable({
  rows,
  isLoading,
  t,
  showHeader = true,
  showViewAll = true,
  viewAllHref = "/partner-links/performance",
  rowHrefBuilder = (row) => `/campaigns/${row.slug}`,
  onRowClick,
  pageSize = 10,
  className,
}) {
  const isClickable = typeof onRowClick === "function";

  const columns = useMemo(
    () => [
      {
        key: "campaign_name",
        label: t("col.campaign"),
        sortable: true,
        width: "34%",
        render: (_v, row) =>
          isClickable ? (
            <span className="text-text font-semibold truncate">
              {row.campaign_name}
            </span>
          ) : (
            <Link
              href={rowHrefBuilder(row)}
              className="group/cell inline-flex items-center gap-[0.375em] text-text font-semibold truncate hover:text-accent-text transition-colors duration-150 ease-out"
            >
              <span className="truncate">{row.campaign_name}</span>
              <ArrowRight
                size="0.75em"
                strokeWidth={2}
                className="shrink-0 opacity-0 transition-opacity duration-150 ease-out group-hover/cell:opacity-100"
              />
            </Link>
          ),
      },
      {
        key: "clicks",
        label: t("col.clicks"),
        sortable: true,
        align: "right",
        width: "14%",
        render: (v) => <Mono>{formatNumber(v)}</Mono>,
      },
      {
        key: "conversions",
        label: t("col.conversions"),
        sortable: true,
        align: "right",
        width: "14%",
        render: (v) => <Mono>{formatNumber(v)}</Mono>,
      },
      {
        key: "conversion_rate",
        label: t("col.conversionRate"),
        sortable: true,
        align: "right",
        width: "14%",
        render: (v) => <Mono>{v}%</Mono>,
      },
      {
        key: "commissions_paid",
        label: t("col.commissionsPaid"),
        sortable: true,
        align: "right",
        width: "24%",
        render: (v) => <Mono accent>{formatDZD(v)}</Mono>,
      },
    ],
    [t, isClickable, rowHrefBuilder],
  );

  return (
    <div className={cn("flex flex-col gap-[0.5em]", className)}>
      {showHeader && (
        <div className="flex items-center justify-between gap-[0.5em] px-[0.25em]">
          <span className="text-[0.6875em] uppercase tracking-[0.08em] text-text-muted font-semibold">
            {t("title")}
          </span>
          {showViewAll && (
            <Link
              href={viewAllHref}
              className="text-[0.75em] font-semibold text-accent-text hover:underline"
            >
              {t("viewAll")}
            </Link>
          )}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows ?? []}
        getRowId={(row) => row.campaign_id}
        isLoading={isLoading}
        onRowClick={onRowClick}
        pageSize={pageSize}
        emptyTitle={t("empty.title")}
        emptySubtitle={t("empty.body")}
        emptyAction={
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-[0.375em] text-[0.75em] font-semibold text-accent-text hover:underline"
          >
            <Link2 size="0.875em" strokeWidth={1.75} />
            {t("empty.cta")}
          </Link>
        }
      />
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
