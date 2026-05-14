"use client";

/**
 * RecentApplicationsPreview — compact applications list inside the
 * campaign detail page (Phase 7.4). Five rows max, pending-first FIFO.
 *
 * Each row: avatar + partner name + relative time + StatusBadge. Rows
 * link to /applications?campaign=<slug> so the company can act on the
 * pitch from the dedicated queue (avoids duplicating the
 * approve/reject + expand-pitch UX here — that lives in /applications).
 *
 * Empty branch: small EmptyState with a "When partners apply, they'll
 * show up here." line. No CTA — the company can't make partners apply.
 */

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Inbox } from "lucide-react";
import Avatar from "@/components/shared/data-display/Avatar";
import StatusBadge from "@/components/shared/data-display/StatusBadge";
import EmptyState from "@/components/shared/feedback/EmptyState";
import { formatRelative } from "@/lib/format/relative-time";

export default function RecentApplicationsPreview({ campaign }) {
  const t = useTranslations("Campaigns.companyDetail.applications");
  const tTime = useTranslations("Dashboard.Notifications.Time");
  const rows = campaign.recent_applications ?? [];
  const totalPending = rows.filter((r) => r.status === "pending").length;

  return (
    <section className="flex flex-col gap-[0.875em]">
      <header className="flex items-center justify-between gap-[1em]">
        <div className="flex flex-col gap-[0.125em]">
          <h2 className="font-heading text-[1.125em] font-semibold tracking-[-0.01em] text-text">
            {t("title")}
          </h2>
          <p className="text-[0.75em] text-text-muted">
            {t("subtitle", { count: campaign.active_partners_count, pending: totalPending })}
          </p>
        </div>
        {rows.length > 0 && (
          <Link
            href={`/applications?campaign=${campaign.slug}`}
            className="inline-flex items-center gap-[0.25em] text-[0.75em] font-medium text-accent-text hover:text-accent transition-colors duration-150 ease-out"
          >
            {t("viewAll")}
            <ArrowRight className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
          </Link>
        )}
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Inbox strokeWidth={1.5} />}
          title={t("emptyTitle")}
          subtitle={t("emptySubtitle")}
          className="bg-bg-alt rounded-[0.625em] min-h-[10em]"
        />
      ) : (
        <ul className="flex flex-col gap-[0.25em] bg-surface border border-border-light rounded-[0.625em] overflow-hidden">
          {rows.map((row, i) => {
            const name = row.partner
              ? `${row.partner.first_name} ${row.partner.last_name}`
              : t("unknownPartner");
            return (
              <li key={row.id}>
                <Link
                  href={`/applications?open=${row.id}`}
                  className={[
                    "group flex items-center gap-[0.875em] px-[1em] py-[0.875em]",
                    "hover:bg-bg-alt transition-[background-color] duration-150 ease-out",
                    i > 0 ? "border-t border-border-light" : "",
                  ].join(" ")}
                >
                  <Avatar name={name} size="sm" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[0.8125em] font-semibold text-text truncate group-hover:text-accent-text transition-colors duration-150 ease-out">
                      {name}
                    </span>
                    <span className="text-[0.75em] text-text-muted truncate">
                      {row.pitch ? row.pitch.slice(0, 80) : t("noPitch")}
                      {row.pitch && row.pitch.length > 80 ? "…" : ""}
                    </span>
                  </div>
                  <span className="font-mono text-[0.6875em] text-text-muted shrink-0">
                    {formatRelative(row.applied_at, tTime)}
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
