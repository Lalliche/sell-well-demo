"use client";

/**
 * RecentLeadsPreview — five most recent leads for this campaign.
 *
 * Each row: client name + partner name overline + relative submitted-time +
 * commission amount (mono) + StatusBadge. Click → /leads/[slug] (the
 * existing lead detail surface owns Reserve/Confirm/Deny actions; we
 * never duplicate them here).
 *
 * Drafts never appear (the mock filters them out at fetch time).
 *
 * Empty branch: small EmptyState pointing the company at how leads
 * arrive — they're submitted by approved partners, not invited.
 */

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Users } from "lucide-react";
import StatusBadge from "@/components/shared/data-display/StatusBadge";
import EmptyState from "@/components/shared/feedback/EmptyState";
import { format as formatDZD } from "@/lib/format/currency";
import { formatRelative } from "@/lib/format/relative-time";

export default function RecentLeadsPreview({ campaign }) {
  const t = useTranslations("Campaigns.companyDetail.leads");
  const tTime = useTranslations("Dashboard.Notifications.Time");
  const rows = campaign.recent_leads ?? [];

  return (
    <section className="flex flex-col gap-[0.875em]">
      <header className="flex items-center justify-between gap-[1em]">
        <div className="flex flex-col gap-[0.125em]">
          <h2 className="font-heading text-[1.125em] font-semibold tracking-[-0.01em] text-text">
            {t("title")}
          </h2>
          <p className="text-[0.75em] text-text-muted">
            {t("subtitle", {
              count: campaign.leads_count,
              converted: campaign.converted_count,
            })}
          </p>
        </div>
        {rows.length > 0 && (
          <Link
            href={`/leads/inbox?campaign=${campaign.slug}`}
            className="inline-flex items-center gap-[0.25em] text-[0.75em] font-medium text-accent-text hover:text-accent transition-colors duration-150 ease-out"
          >
            {t("viewAll")}
            <ArrowRight className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
          </Link>
        )}
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Users strokeWidth={1.5} />}
          title={t("emptyTitle")}
          subtitle={t("emptySubtitle")}
          className="bg-bg-alt rounded-[0.625em] min-h-[10em]"
        />
      ) : (
        <ul className="flex flex-col gap-[0.25em] bg-surface border border-border-light rounded-[0.625em] overflow-hidden">
          {rows.map((row, i) => {
            const partnerName = row.partner
              ? `${row.partner.first_name} ${row.partner.last_name}`
              : t("unknownPartner");
            const ts = row.submitted_at ?? row.created_at;
            return (
              <li key={row.id}>
                <Link
                  href={`/leads/${row.slug}`}
                  className={[
                    "group flex items-center gap-[0.875em] px-[1em] py-[0.875em]",
                    "hover:bg-bg-alt transition-[background-color] duration-150 ease-out",
                    i > 0 ? "border-t border-border-light" : "",
                  ].join(" ")}
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[0.8125em] font-semibold text-text truncate group-hover:text-accent-text transition-colors duration-150 ease-out">
                      {row.client_full_name}
                    </span>
                    <span className="text-[0.6875em] uppercase tracking-[0.06em] text-text-muted truncate">
                      {t("submittedBy", { name: partnerName })}
                    </span>
                  </div>
                  <span className="font-mono text-[0.6875em] text-text-muted shrink-0 hidden sm:inline">
                    {formatRelative(ts, tTime)}
                  </span>
                  <span className="font-mono text-[0.8125em] font-semibold text-accent shrink-0">
                    +{formatDZD(row.commission_amount, { withSymbol: false })}
                  </span>
                  <StatusBadge status={row.status} className="shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
