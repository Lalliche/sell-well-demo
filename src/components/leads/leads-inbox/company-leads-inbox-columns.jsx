"use client";

/** Column factory for the company-side /leads inbox. */

import StatusBadge from "@/components/shared/data-display/StatusBadge";
import { formatRelative } from "@/lib/format/relative-time";
import {
  CompanyLeadPartnerCell,
  CompanyLeadClientCell,
  CompanyLeadCampaignCell,
  ReservationCell,
} from "./cells";

export function buildCompanyLeadsInboxColumns({
  locale,
  tTable,
  tTime,
  tCells,
  available,
}) {
  return [
    {
      key: "partner",
      label: tTable("partner"),
      sortable: false,
      width: "13em",
      render: (_v, row) => (
        <CompanyLeadPartnerCell row={row} fallback={tTable("partnerUnknown")} />
      ),
    },
    {
      key: "client",
      label: tTable("client"),
      sortable: false,
      width: "13em",
      render: (_v, row) => <CompanyLeadClientCell row={row} t={tCells} />,
    },
    {
      key: "campaign",
      label: tTable("campaign"),
      sortable: false,
      width: "12em",
      render: (_v, row) => <CompanyLeadCampaignCell row={row} />,
    },
    {
      key: "reservation",
      label: tTable("reservation"),
      sortable: false,
      width: "9em",
      render: (_v, row) => (
        <ReservationCell row={row} available={available} t={tCells} />
      ),
    },
    {
      key: "submitted_at",
      label: tTable("submitted"),
      sortable: true,
      width: "8em",
      render: (_v, row) => {
        const ts = row.submitted_at ?? row.created_at;
        return (
          <span
            className="text-[0.8125em] font-mono tabular-nums text-text-secondary"
            title={new Date(ts).toLocaleString(locale, {
              dateStyle: "long",
              timeStyle: "short",
            })}
          >
            {formatRelative(ts, tTime)}
          </span>
        );
      },
    },
    {
      key: "status",
      label: tTable("status"),
      sortable: false,
      width: "9em",
      render: (v) => <StatusBadge status={v} />,
    },
  ];
}
