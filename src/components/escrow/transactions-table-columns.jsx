"use client";

/** Column factory for the wallet transactions table on /escrow.
 *
 *  Columns: Date · Type · Description · Related lead · Amount · Balance after.
 *  Sortable: created_at, balance_after. */

import { format as formatDZD } from "@/lib/format/currency";
import {
  TransactionTypeCell,
  TransactionAmountCell,
  RelatedLeadCell,
} from "./cells";

export function buildTransactionsColumns({ locale, tTable, tType, tRelated }) {
  return [
    {
      key: "created_at",
      label: tTable("date"),
      sortable: true,
      width: "10em",
      render: (v) => (
        <span
          className="font-mono text-[0.75em] tabular-nums text-text-secondary whitespace-nowrap"
          title={new Date(v).toLocaleString(locale, {
            dateStyle: "long",
            timeStyle: "short",
          })}
        >
          {new Date(v).toLocaleDateString(locale, {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "type",
      label: tTable("type"),
      sortable: false,
      width: "13em",
      render: (v) => <TransactionTypeCell type={v} t={tType} />,
    },
    {
      key: "description",
      label: tTable("description"),
      sortable: false,
      render: (v) => (
        <span className="text-[0.8125em] text-text-secondary truncate">{v}</span>
      ),
    },
    {
      key: "related_lead",
      label: tTable("relatedLead"),
      sortable: false,
      width: "8em",
      render: (v) => <RelatedLeadCell leadId={v} t={tRelated} />,
    },
    {
      key: "amount",
      label: tTable("amount"),
      sortable: true,
      width: "8em",
      render: (v, row) => <TransactionAmountCell amount={v} type={row.type} />,
    },
    {
      key: "balance_after",
      label: tTable("balanceAfter"),
      sortable: true,
      width: "9em",
      render: (v) => (
        <span className="font-mono text-[0.75em] tabular-nums text-text-muted whitespace-nowrap">
          {formatDZD(v)}
        </span>
      ),
    },
  ];
}
