"use client";

/**
 * SalesSection — flat sales-row list for a single PartnerLink.
 *
 * Mercury-style row order: date on the left as the primary scan axis,
 * then sale amount, then commission. Newest first. No drill-down — each
 * row is the leaf record (a Chargily payment confirmation).
 *
 * Empty when the link has zero attributed sales.
 */

import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { fetchPartnerLinkSales } from "@/lib/mock/partner-links";
import { fmtDA, formatShortDate } from "./partner-link-helpers";

export default function SalesSection({ link, locale, t }) {
  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["partner-link-sales", { linkId: link.id }],
    queryFn: () => fetchPartnerLinkSales({ linkId: link.id }),
  });

  if (isLoading) {
    return (
      <div className="text-[0.8125em] text-text-muted">
        {t("sales.loading")}
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="flex items-center gap-[0.625em] text-[0.8125em] text-text-muted bg-bg-alt/40 border border-dashed border-border-light rounded-[0.5em] px-[0.875em] py-[0.75em]">
        <Receipt className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
        {t("sales.empty")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[0.5em]">
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-[1em] px-[0.5em] text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted">
        <span>{t("sales.colDate")}</span>
        <span className="text-right">{t("sales.colSale")}</span>
        <span className="text-right">{t("sales.colCommission")}</span>
      </div>
      <ol className="flex flex-col gap-[0.25em]">
        {sales.map((s) => (
          <li
            key={s.id}
            className="grid grid-cols-[1fr_auto_auto] gap-x-[1em] items-center px-[0.5em] py-[0.625em] rounded-[0.375em] hover:bg-bg-alt/40 transition-[background-color] duration-150 ease-out"
          >
            <span className="text-[0.8125em] text-text">
              {formatShortDate(s.created_at, locale) ?? "—"}
            </span>
            <span className="text-right text-[0.8125em] font-mono tabular-nums text-text">
              {fmtDA(s.sale_amount)} DA
            </span>
            <span className="text-right text-[0.8125em] font-mono tabular-nums font-semibold text-accent">
              {fmtDA(s.commission_amount)} DA
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
