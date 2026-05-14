"use client";

/**
 * Leads inbox preview — left column of the company dashboard's hero zone.
 *
 * Filter chips above the table act as quick triage views:
 *   "all"               — every lead the company can see (default)
 *   "awaitingReserve"   — submitted | pending_escrow (need Reserve & View)
 *   "inWindow"          — acknowledged (in the tracking window)
 *   "awaitingConfirm"   — acknowledged + tracking_window_expires_at < 14 days
 *   "disputed"          — disputed_verifying | expired_verifying
 *
 * Each chip shows a live count.
 *
 * Each row: client name + company + submitted-relative-date · partner name
 * (in muted overline) · reservation amount (mono) · StatusBadge · action arrow.
 * Click → /leads/[slug]. The full /leads/inbox page (Phase 7.6) handles the
 * inline Reserve & View flow; the dashboard preview links into it.
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import StatusBadge from "@/components/shared/data-display/StatusBadge";
import { format as formatDZD } from "@/lib/format/currency";
import { cn } from "@/lib/utils";
import { MOCK_PARTNER_PROFILES } from "@/lib/mock/_seed/partner-profiles";

const FILTERS = ["all", "awaitingReserve", "inWindow", "awaitingConfirm", "disputed"];
const PAGE_SIZE = 5;

function partnerNameFor(partnerId) {
  const p = MOCK_PARTNER_PROFILES.find((pp) => pp.id === partnerId);
  if (!p) return "—";
  return `${p.first_name} ${p.last_name}`;
}

function dateLabel(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function isAwaitingConfirm(lead) {
  if (lead.status !== "acknowledged") return false;
  if (!lead.tracking_window_expires_at) return false;
  const ms = new Date(lead.tracking_window_expires_at).getTime() - Date.now();
  return ms <= 14 * 86_400_000;
}

export default function LeadsInboxPreview({ leads, isLoading }) {
  const t = useTranslations("Dashboard.CompanyDashboard.leadsInbox");
  const tFilter = useTranslations("Dashboard.CompanyDashboard.leadsInbox.filter");
  const [filter, setFilter] = useState("all");

  const counts = useMemo(() => {
    if (!leads) {
      return { all: 0, awaitingReserve: 0, inWindow: 0, awaitingConfirm: 0, disputed: 0 };
    }
    return {
      all: leads.length,
      awaitingReserve: leads.filter((l) =>
        ["submitted", "pending_escrow"].includes(l.status),
      ).length,
      inWindow: leads.filter((l) => l.status === "acknowledged").length,
      awaitingConfirm: leads.filter(isAwaitingConfirm).length,
      disputed: leads.filter((l) =>
        ["disputed_verifying", "expired_verifying"].includes(l.status),
      ).length,
    };
  }, [leads]);

  const filtered = useMemo(() => {
    if (!leads) return [];
    if (filter === "awaitingReserve") {
      return leads.filter((l) => ["submitted", "pending_escrow"].includes(l.status));
    }
    if (filter === "inWindow") {
      return leads.filter((l) => l.status === "acknowledged");
    }
    if (filter === "awaitingConfirm") {
      return leads.filter(isAwaitingConfirm);
    }
    if (filter === "disputed") {
      return leads.filter((l) =>
        ["disputed_verifying", "expired_verifying"].includes(l.status),
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
          href="/leads/inbox"
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
              <span
                className={cn(
                  "font-mono text-[0.875em] leading-none",
                  active ? "text-accent-text" : "text-text-muted",
                )}
              >
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
  const t = useTranslations("Dashboard.CompanyDashboard.leadsInbox");
  const partnerName = partnerNameFor(lead.sales_partner);
  const submittedAt = lead.submitted_at ?? lead.created_at;

  return (
    <Link
      href={`/leads/${lead.slug}`}
      className={cn(
        "group flex items-center gap-[0.875em] px-[1.25em] py-[0.875em]",
        "hover:bg-bg-alt transition-[background-color] duration-150 ease-out",
        "focus-visible:outline-none focus-visible:bg-bg-alt",
      )}
    >
      <div className="flex-1 min-w-0 flex flex-col gap-[0.125em]">
        <span className="text-[0.875em] font-semibold text-text truncate transition-colors duration-150 ease-out group-hover:text-accent-text">
          {lead.client_full_name}
        </span>
        <span className="text-[0.75em] text-text-muted truncate">
          {lead.client_company_name ?? t("noCompany")} · {partnerName} · {dateLabel(submittedAt)}
        </span>
      </div>
      <span className="shrink-0 font-mono text-[0.8125em] text-text tabular-nums">
        {formatDZD(lead.total_reservation)}
      </span>
      <StatusBadge status={lead.status} />
      <ArrowRight
        size="0.875em"
        strokeWidth={2}
        className="shrink-0 text-text-muted transition-transform duration-150 ease-out group-hover:translate-x-[0.125em] group-hover:text-text-secondary"
      />
    </Link>
  );
}

function Empty({ filter }) {
  const t = useTranslations("Dashboard.CompanyDashboard.leadsInbox.empty");
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
