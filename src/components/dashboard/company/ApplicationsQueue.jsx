"use client";

/**
 * Applications queue — left column of the dashboard's secondary row.
 *
 * Pending applications float to the top (oldest first — first-in-first-out
 * fairness for partners). After clearing pending the list shows the most
 * recent decided applications with their final status.
 *
 * Each row: avatar (initials) + partner name · campaign name · pitch
 * preview (single-line clamp) · "X days ago" · ArrowRight chevron.
 *
 * Clicking a row routes to /applications/:id (Phase 7.5 owns the
 * approve/reject inline UX). The dashboard preview itself is read-only —
 * we don't want the company casually approving people from a glance card
 * without seeing the full pitch + profile context first.
 */

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, UserPlus } from "lucide-react";
import Avatar from "@/components/shared/data-display/Avatar";
import StatusBadge from "@/components/shared/data-display/StatusBadge";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 4;

function relativeDays(iso) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return { unit: "today" };
  return { unit: "days", count: days };
}

export default function ApplicationsQueue({ applications, isLoading }) {
  const t = useTranslations("Dashboard.CompanyDashboard.applications");
  const tWhen = useTranslations("Dashboard.CompanyDashboard.applications.when");
  const pendingCount = (applications ?? []).filter((a) => a.status === "pending").length;

  return (
    <div className="w-full h-full bg-surface border border-border-light rounded-[0.75em] shadow-xs flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-[0.5em] px-[1.25em] pt-[1em] pb-[0.75em] border-b border-border-light">
        <div className="flex items-center gap-[0.5em]">
          <span className="text-[0.6875em] uppercase tracking-[0.08em] text-text-muted font-semibold">
            {t("title")}
          </span>
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.5em] h-[1.25em] px-[0.375em] rounded-full bg-accent-light text-accent-text font-mono text-[0.6875em] font-semibold">
              {pendingCount}
            </span>
          )}
        </div>
        <Link
          href="/applications"
          className="text-[0.75em] font-semibold text-accent-text hover:underline"
        >
          {t("viewAll")}
        </Link>
      </div>

      {isLoading ? (
        <RowsSkeleton />
      ) : !applications || applications.length === 0 ? (
        <Empty />
      ) : (
        <ul className="flex flex-col divide-y divide-border-light">
          {applications.slice(0, PAGE_SIZE).map((app) => (
            <li key={app.id}>
              <ApplicationRow app={app} tWhen={tWhen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ApplicationRow({ app, tWhen }) {
  const partnerName = `${app.partner.first_name} ${app.partner.last_name}`;
  const when = relativeDays(app.applied_at);
  const whenLabel = when?.unit === "today" ? tWhen("today") : tWhen("daysAgo", { count: when?.count ?? 0 });

  return (
    <Link
      href={`/applications`}
      className={cn(
        "group flex items-start gap-[0.75em] px-[1.25em] py-[0.875em]",
        "hover:bg-bg-alt transition-[background-color] duration-150 ease-out",
        "focus-visible:outline-none focus-visible:bg-bg-alt",
      )}
    >
      <Avatar name={partnerName} size="md" className="mt-[0.125em]" />

      <div className="flex-1 min-w-0 flex flex-col gap-[0.25em]">
        <div className="flex items-baseline gap-[0.5em] flex-wrap">
          <span className="text-[0.875em] font-semibold text-text truncate transition-colors duration-150 ease-out group-hover:text-accent-text">
            {partnerName}
          </span>
          <span className="text-[0.6875em] text-text-muted font-mono shrink-0">
            {whenLabel}
          </span>
        </div>
        <span className="text-[0.75em] text-text-secondary truncate">
          {app.campaign.product_name}
        </span>
        <span className="text-[0.75em] text-text-muted leading-[1.45] line-clamp-1">
          “{app.pitch}”
        </span>
      </div>

      <div className="shrink-0 flex flex-col items-end gap-[0.375em]">
        <StatusBadge status={app.status} />
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
  const t = useTranslations("Dashboard.CompanyDashboard.applications.empty");
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-[0.5em] px-[1.25em] py-[2em]">
      <span
        aria-hidden="true"
        className="inline-flex items-center justify-center w-[2.25em] h-[2.25em] rounded-full bg-accent-light text-accent-text"
      >
        <UserPlus size="1em" strokeWidth={1.75} />
      </span>
      <span className="text-[0.875em] font-medium text-text">{t("title")}</span>
      <span className="text-[0.75em] text-text-muted leading-[1.5] max-w-[20em]">
        {t("body")}
      </span>
    </div>
  );
}

function RowsSkeleton() {
  return (
    <ul className="flex flex-col divide-y divide-border-light">
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex items-start gap-[0.75em] px-[1.25em] py-[0.875em]">
          <span className="block w-[2.25em] h-[2.25em] rounded-full bg-bg-alt shrink-0" />
          <div className="flex-1 flex flex-col gap-[0.375em]">
            <span className="block h-[0.75em] w-[40%] rounded-[0.25em] bg-bg-alt" />
            <span className="block h-[0.625em] w-[60%] rounded-[0.25em] bg-bg-alt" />
            <span className="block h-[0.625em] w-[90%] rounded-[0.25em] bg-bg-alt" />
          </div>
          <span className="block h-[1.25em] w-[4em] rounded-full bg-bg-alt" />
        </li>
      ))}
    </ul>
  );
}
