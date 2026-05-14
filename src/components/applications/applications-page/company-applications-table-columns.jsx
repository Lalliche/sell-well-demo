"use client";

/** Column factory for the company-side /applications table.
 *
 * Columns: Partner (avatar + name + bio fragment) · Campaign (compact
 * product cell) · Pitch preview · Applied (relative time) · Status badge.
 *
 * The partner-side factory lives next to this one in
 * `applications-table-columns.jsx`. The two share zero state — they
 * encode different relevance hierarchies (partner sees their own
 * campaigns first; the company sees the partners applying to them).
 */

import StatusBadge from "@/components/shared/data-display/StatusBadge";
import { formatRelative } from "@/lib/format/relative-time";
import PartnerCell from "./PartnerCell";

export function buildCompanyApplicationsColumns({ locale, tTable, tTime }) {
  return [
    {
      key: "partner",
      label: tTable("partner"),
      sortable: false,
      width: "20em",
      render: (_v, row) => (
        <PartnerCell row={row} fallback={tTable("partnerUnknown")} />
      ),
    },
    {
      key: "campaign",
      label: tTable("campaign"),
      sortable: false,
      width: "14em",
      render: (_v, row) => (
        <div className="flex flex-col min-w-0">
          <span className="text-[0.8125em] font-medium text-text truncate">
            {row.campaign.product_name}
          </span>
          <span className="text-[0.6875em] text-text-muted truncate font-body">
            <StatusBadge status={row.campaign.status} className="text-[0.6875em] py-[0.0625em] px-[0.5em]" />
          </span>
        </div>
      ),
    },
    {
      key: "pitch",
      label: tTable("pitch"),
      sortable: false,
      render: (_v, row) => (
        <span className="text-[0.8125em] text-text-secondary font-body">{row.pitch}</span>
      ),
    },
    {
      key: "applied_at",
      label: tTable("applied"),
      sortable: true,
      width: "9em",
      render: (v) => (
        <span
          className="text-[0.8125em] font-mono tabular-nums text-text-secondary"
          title={new Date(v).toLocaleString(locale, { dateStyle: "long", timeStyle: "short" })}
        >
          {formatRelative(v, tTime)}
        </span>
      ),
    },
    {
      key: "status",
      label: tTable("status"),
      sortable: false,
      width: "8em",
      render: (v) => <StatusBadge status={v} />,
    },
  ];
}
