"use client";

/**
 * Recent leads table — left column of the dashboard's activity zone.
 *
 * Filter chips above the table act as quick views:
 *   "all"               — every lead (default)
 *   "expiringSoon"      — acknowledged + tracking_window expires < 48h
 *   "awaitingConfirm"   — submitted + acknowledged (the "in flight" buckets)
 *   "confirmedThisMonth"— converted | converted_verified, resolved this month
 *
 * Each chip shows a live count.
 *
 * Click a row → /leads/:id (placeholder for now, actual page lands in
 * Phase 6.7).
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import StatusBadge from "@/components/shared/data-display/StatusBadge";
import { format as formatDZD } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "expiringSoon", "awaitingConfirm", "confirmedThisMonth"];
const PAGE_SIZE = 5;

function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function RecentLeadsTable({ leads, isLoading }) {
  const t = useTranslations("Dashboard.PartnerDashboard.recentLeads");
  const tFilter = useTranslations("Dashboard.PartnerDashboard.recentLeads.filter");
  const [filter, setFilter] = useState("all");

  const counts = useMemo(() => {
    if (!leads) return { all: 0, expiringSoon: 0, awaitingConfirm: 0, confirmedThisMonth: 0 };
    const horizon = Date.now() + 48 * 3600 * 1000;
    const monthStart = startOfMonth(new Date()).getTime();
    return {
      all: leads.length,
      expiringSoon: leads.filter(
        (l) =>
          l.status === "acknowledged" &&
          l.tracking_window_expires_at &&
          new Date(l.tracking_window_expires_at).getTime() <= horizon,
      ).length,
      awaitingConfirm: leads.filter(
        (l) => l.status === "submitted" || l.status === "acknowledged",
      ).length,
      confirmedThisMonth: leads.filter(
        (l) =>
          (l.status === "converted" || l.status === "converted_verified") &&
          l.resolved_at &&
          new Date(l.resolved_at).getTime() >= monthStart,
      ).length,
    };
  }, [leads]);

  const filtered = useMemo(() => {
    if (!leads) return [];
    const horizon = Date.now() + 48 * 3600 * 1000;
    const monthStart = startOfMonth(new Date()).getTime();
    if (filter === "expiringSoon") {
      return leads.filter(
        (l) =>
          l.status === "acknowledged" &&
          l.tracking_window_expires_at &&
          new Date(l.tracking_window_expires_at).getTime() <= horizon,
      );
    }
    if (filter === "awaitingConfirm") {
      return leads.filter(
        (l) => l.status === "submitted" || l.status === "acknowledged",
      );
    }
    if (filter === "confirmedThisMonth") {
      return leads.filter(
        (l) =>
          (l.status === "converted" || l.status === "converted_verified") &&
          l.resolved_at &&
          new Date(l.resolved_at).getTime() >= monthStart,
      );
    }
    return leads;
  }, [leads, filter]);

  return (
    <div className="w-full h-full bg-surface border border-border-light rounded-[0.75em] shadow-xs flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-[0.5em] px-[1.25em] pt-[1em] pb-[0.75em]">
        <span className="text-[0.6875em] uppercase tracking-[0.08em] text-text-muted font-semibold">
          {t("title")}
        </span>
        <Link
          href="/leads"
          className="text-[0.75em] font-semibold text-accent-text hover:underline"
        >
          {t("viewAll")}
        </Link>
      </div>

      <div className="flex flex-wrap gap-[0.375em] px-[1.25em] pb-[0.75em] border-b border-border-light">
        {FILTERS.map((key) => {
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-[0.375em] h-[1.875em] px-[0.75em] rounded-full",
                "text-[0.75em] font-medium border",
                "transition-[background-color,color,border-color] duration-150 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
                active
                  ? "bg-accent-light text-accent-text border-[var(--accent-border)]"
                  : "bg-surface text-text-secondary border-border-light hover:border-border hover:text-text",
              )}
            >
              {tFilter(key)}
              <span className={cn("font-mono text-[0.875em] leading-none", active ? "text-accent-text" : "text-text-muted")}>
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <RowsSkeleton />
      ) : filtered.length === 0 ? (
        <Empty filter={filter} />
      ) : (
        <ul className="flex flex-col divide-y divide-border-light">
          {filtered.slice(0, PAGE_SIZE).map((lead) => (
            <li key={lead.id}>
              <LeadRow lead={lead} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LeadRow({ lead }) {
  const t = useTranslations("Dashboard.PartnerDashboard.recentLeads");
  return (
    <Link
      href={`/leads/${lead.slug}`}
      className="flex items-center gap-[0.875em] px-[1.25em] py-[0.875em] hover:bg-bg-alt transition-[background-color] duration-150 ease-out focus-visible:outline-none focus-visible:bg-bg-alt"
    >
      <div className="flex-1 min-w-0 flex flex-col gap-[0.125em]">
        <span className="text-[0.875em] font-semibold text-text truncate">
          {lead.client_full_name}
        </span>
        <span className="text-[0.75em] text-text-muted truncate">
          {lead.client_company_name ?? t("noCompany")} · {dateLabel(lead.submitted_at)}
        </span>
      </div>
      <span className="shrink-0 font-mono text-[0.8125em] text-text tabular-nums">
        {formatDZD(lead.commission_amount)}
      </span>
      <StatusBadge status={lead.status} />
    </Link>
  );
}

function dateLabel(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Empty({ filter }) {
  const t = useTranslations("Dashboard.PartnerDashboard.recentLeads.empty");
  const titleKey = filter === "all" ? "allTitle" : `${filter}Title`;
  const bodyKey  = filter === "all" ? "allBody"  : `${filter}Body`;
  return (
    <div className="flex flex-col items-center text-center gap-[0.375em] px-[1.25em] py-[2.5em]">
      <span className="text-[0.875em] font-medium text-text">{t(titleKey)}</span>
      <span className="text-[0.75em] text-text-muted leading-[1.5] max-w-[24em]">
        {t(bodyKey)}
      </span>
    </div>
  );
}

function RowsSkeleton() {
  return (
    <ul className="flex flex-col divide-y divide-border-light">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="flex items-center gap-[0.875em] px-[1.25em] py-[0.875em]">
          <div className="flex-1 flex flex-col gap-[0.375em]">
            <span className="block h-[0.75em] w-[40%] rounded-[0.25em] bg-bg-alt" />
            <span className="block h-[0.625em] w-[60%] rounded-[0.25em] bg-bg-alt" />
          </div>
          <span className="block h-[0.75em] w-[4em] rounded-[0.25em] bg-bg-alt" />
          <span className="block h-[1.25em] w-[5em] rounded-full bg-bg-alt" />
        </li>
      ))}
    </ul>
  );
}
