"use client";

/**
 * AttentionQueueCard — generic mini-table card for the admin dashboard's
 * "Needs your attention" section. Used 3 times: verifications,
 * withdrawals, disputes.
 *
 * Pattern researched against Stripe Radar's review queue: surface 3 actual
 * rows of the queue's top items inline (not just a count) so the admin
 * can triage without opening the full queue page.
 *
 * Props:
 *   title          string — card title (e.g. "Verifications").
 *   totalCount     number — total items in queue (for the "See all" CTA).
 *   rows           Array<{
 *                    key: string,             // unique row id
 *                    primary: string,         // main label (e.g. user name)
 *                    secondary: string,       // sub label (e.g. role / role+email)
 *                    days_waiting: number,    // days since signup/request
 *                    href: string,            // deep link
 *                    badge?: ReactNode,       // optional small badge slot
 *                  }>
 *   seeAllHref     string — link to the full queue page
 *   seeAllLabel    string — "See all 12" copy
 *   emptyLabel     string — body copy when rows is empty
 *   icon           ReactNode — top-left icon
 *
 * Visual: lightweight bordered card. Each row is a Link with hover bg.
 * Days waiting renders as a small inline mono text — no escalation tone
 * (user didn't pick that pattern, but the data is there if we add it).
 */

import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function AttentionQueueCard({
  title,
  totalCount = 0,
  rows = [],
  seeAllHref,
  seeAllLabel,
  emptyLabel,
  icon,
}) {
  const hasRows = rows.length > 0;

  return (
    <div className="bg-surface border border-border-light rounded-[0.625em] shadow-xs flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-[1.25em] pt-[1em] pb-[0.75em]">
        <div className="flex items-center gap-[0.5em]">
          {icon && <span className="text-text-muted">{icon}</span>}
          <h3 className="text-[0.875em] font-semibold font-body text-text">
            {title}
          </h3>
          {totalCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.5em] h-[1.5em] px-[0.4em] rounded-full bg-bg-alt text-[0.6875em] font-semibold font-mono tabular-nums text-text-secondary">
              {totalCount}
            </span>
          )}
        </div>
        {hasRows && totalCount > rows.length && (
          <Link
            href={seeAllHref}
            className="text-[0.75em] font-semibold text-accent hover:text-accent-hover transition-[color] duration-150"
          >
            {seeAllLabel}
          </Link>
        )}
      </div>

      <div className="h-[1px] bg-border-light" />

      {/* Rows */}
      {hasRows ? (
        <ul className="flex flex-col">
          {rows.map((row, i) => (
            <li
              key={row.key}
              className={cn(
                "border-b border-border-light last:border-b-0",
              )}
            >
              <Link
                href={row.href}
                className={cn(
                  "flex items-center justify-between gap-[0.75em]",
                  "px-[1.25em] py-[0.75em]",
                  "hover:bg-surface-hover transition-[background-color] duration-150",
                  "focus-visible:outline-none focus-visible:bg-surface-hover",
                )}
              >
                <div className="flex flex-col gap-[0.125em] min-w-0">
                  <span className="text-[0.875em] font-medium text-text truncate">
                    {row.primary}
                  </span>
                  <span className="text-[0.75em] text-text-muted truncate">
                    {row.secondary}
                  </span>
                </div>
                <div className="flex items-center gap-[0.75em] shrink-0">
                  {row.badge}
                  <span className="text-[0.75em] font-mono tabular-nums text-text-secondary whitespace-nowrap">
                    {row.days_waiting === 0
                      ? "<1d"
                      : `${row.days_waiting}d`}
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    size="0.875em"
                    strokeWidth={2}
                    className="text-text-muted"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-[1.25em] py-[1.5em] text-[0.8125em] text-text-muted text-center">
          {emptyLabel}
        </div>
      )}

      {/* See all link at footer when there are extra rows */}
      {hasRows && totalCount > rows.length && (
        <>
          <div className="h-[1px] bg-border-light" />
          <Link
            href={seeAllHref}
            className="px-[1.25em] py-[0.75em] text-[0.75em] font-semibold text-text-secondary hover:text-text transition-[color] duration-150 text-center"
          >
            {seeAllLabel} →
          </Link>
        </>
      )}
    </div>
  );
}
