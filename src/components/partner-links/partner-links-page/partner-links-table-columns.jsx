"use client";

/**
 * Column factory for /partner-links. Returns the DataTable `columns`
 * array given locale + scoped translators. Lives outside the page so
 * the column shapes (incl. cell renderers) stay readable as a unit.
 */

import { CampaignCell, LinkCell, PerformanceCell } from "./cells";

function fmtDA(n) {
  if (typeof n !== "number") return "—";
  return Number(n).toLocaleString("fr-DZ");
}

export function buildPartnerLinksColumns({ tTable, copyLabels }) {
  return [
    {
      key: "campaign",
      label: tTable("campaign"),
      sortable: false,
      width: "16em",
      render: (_v, row) => <CampaignCell row={row} />,
    },
    {
      key: "url",
      label: tTable("link"),
      sortable: false,
      width: "16em",
      render: (_v, row) => <LinkCell row={row} labels={copyLabels} />,
    },
    {
      key: "total_clicks",
      label: tTable("clicks"),
      sortable: true,
      width: "6em",
      align: "right",
      render: (v) => (
        <span className="font-mono tabular-nums text-[0.8125em] text-text">{fmtDA(v)}</span>
      ),
    },
    {
      key: "total_conversions",
      label: tTable("conversions"),
      sortable: true,
      width: "7em",
      align: "right",
      render: (v) => (
        <span className="font-mono tabular-nums text-[0.8125em] text-text">{fmtDA(v)}</span>
      ),
    },
    {
      key: "conversion_rate",
      label: tTable("performance"),
      sortable: true,
      width: "9em",
      render: (_v, row) => <PerformanceCell row={row} ariaLabel={tTable("trendAria")} />,
    },
  ];
}
