"use client";

/**
 * LeaderboardCard — top-N mini-table for the admin dashboard.
 *
 * Pattern researched against Mercury / Ramp transaction-and-trend tables:
 * each row is one entity + its 30-day trend sparkline + the headline
 * metric + a delta pill. Visually dense, scannable, premium-feeling.
 *
 * Used 3× on the admin dashboard:
 *   - Top campaigns by leads (this month)
 *   - Top partners by commission (this month)
 *   - Top companies by escrow funded (all-time)
 *
 * Props:
 *   title          string
 *   eyebrow        string — small label above title (e.g. "This month")
 *   rows           Array<{
 *                    key:            string,
 *                    avatar_name:    string,    // for initials
 *                    primary:        string,    // main label
 *                    secondary:      string,    // sub label (company, role, etc.)
 *                    metric_value:   string,    // pre-formatted display value
 *                    sparkline:      number[],
 *                    delta:          number,
 *                  }>
 *   emptyLabel     string
 */

import Sparkline from "@/components/shared/analytics/Sparkline";
import Avatar from "@/components/shared/data-display/Avatar";
import DeltaPill from "@/components/shared/data-display/DeltaPill";

export default function LeaderboardCard({
  title,
  eyebrow,
  rows = [],
  emptyLabel,
}) {
  const hasRows = rows.length > 0;

  return (
    <div className="bg-surface border border-border-light rounded-[0.625em] shadow-xs flex flex-col">

      {/* Header */}
      <div className="px-[1.25em] pt-[1em] pb-[0.75em] flex flex-col gap-[0.125em]">
        {eyebrow && (
          <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
            {eyebrow}
          </span>
        )}
        <h3 className="text-[0.9375em] font-semibold font-body text-text">
          {title}
        </h3>
      </div>

      <div className="h-px bg-border-light" />

      {/* Rows */}
      {hasRows ? (
        <ul className="flex flex-col">
          {rows.map((row, i) => (
            <li
              key={row.key}
              className="flex items-center gap-[0.875em] px-[1.25em] py-[0.75em] border-b border-border-light last:border-b-0"
            >
              {/* Rank */}
              <span className="text-[0.75em] font-mono tabular-nums font-semibold text-text-muted w-[1em] shrink-0">
                {i + 1}
              </span>

              {/* Avatar */}
              <Avatar name={row.avatar_name} size="sm" />

              {/* Primary + secondary */}
              <div className="flex flex-col gap-[0.0625em] min-w-0 flex-1">
                <span className="text-[0.8125em] font-medium text-text truncate">
                  {row.primary}
                </span>
                <span className="text-[0.6875em] text-text-muted truncate">
                  {row.secondary}
                </span>
              </div>

              {/* Sparkline — inline mode (the default "fill" mode would
                  break out of its container and render full-page). */}
              {Array.isArray(row.sparkline) && row.sparkline.length >= 2 && (
                <Sparkline
                  data={row.sparkline}
                  mode="inline"
                  width="4em"
                  height="1.75em"
                  tone={row.delta > 0 ? "positive" : row.delta < 0 ? "negative" : "muted"}
                  ariaLabel="30-day trend"
                />
              )}

              {/* Metric value */}
              <span className="text-[0.8125em] font-mono tabular-nums font-semibold text-text shrink-0 whitespace-nowrap">
                {row.metric_value}
              </span>

              {/* Delta */}
              <DeltaPill value={row.delta} size="sm" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-[1.25em] py-[2em] text-[0.8125em] text-text-muted text-center">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}
