"use client";

/** Column factory for /applications. Returns the DataTable columns. */

import StatusBadge from "@/components/shared/data-display/StatusBadge";
import { formatRelative } from "@/lib/format/relative-time";
import CampaignCell from "./CampaignCell";

export function buildApplicationsColumns({ locale, tTable, tTime }) {
  return [
    {
      key: "campaign",
      label: tTable("campaign"),
      sortable: false,
      width: "22em",
      render: (_v, row) => <CampaignCell row={row} locale={locale} fallback={tTable("companyUnknown")} />,
    },
    {
      // Single-line clamp inside DataTable's truncate wrapper. Full pitch
      // is one click away in the DetailOverlay — keeps the table dense.
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
