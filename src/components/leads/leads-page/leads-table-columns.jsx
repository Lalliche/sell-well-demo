"use client";

/**
 * Column factory for /leads. Returns the DataTable `columns` array given
 * locale + translator + relative-time formatter. Lives outside the page
 * so the column shapes (incl. cell renderers) stay readable as a unit
 * and the page orchestrator doesn't grow with column wiring.
 */

import StatusBadge from "@/components/shared/data-display/StatusBadge";
import { formatRelative } from "@/lib/format/relative-time";
import { cn } from "@/lib/utils";
import { ClientCell, CampaignCell } from "./cells";

function fmtDA(n) {
  if (typeof n !== "number") return "—";
  return Number(n).toLocaleString("fr-DZ");
}

const COMMISSION_VISIBLE_STATUSES = new Set([
  "converted",
  "converted_verified",
  "acknowledged",
  "submitted",
  "pending_escrow",
  "disputed_verifying",
  "expired_verifying",
]);

export function buildLeadsColumns({ locale, tTable, tTime }) {
  return [
    {
      key: "client",
      label: tTable("client"),
      sortable: false,
      width: "16em",
      render: (_v, row) => <ClientCell row={row} />,
    },
    {
      key: "campaign",
      label: tTable("campaign"),
      sortable: false,
      width: "14em",
      render: (_v, row) => <CampaignCell row={row} locale={locale} />,
    },
    {
      // Tier column: collapses to a single-line price for single-tier
      // campaigns; surfaces tier name + price for multi-tier.
      key: "tier",
      label: tTable("tier"),
      sortable: false,
      width: "9em",
      render: (_v, row) => <TierCell row={row} />,
    },
    {
      key: "status",
      label: tTable("status"),
      sortable: false,
      width: "9em",
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: "submitted_at",
      label: tTable("submitted"),
      sortable: true,
      width: "8em",
      render: (v, row) => {
        // Drafts haven't been submitted — fall back to created_at so the
        // column still shows when the partner started the lead.
        const stamp = v ?? row.created_at;
        if (!stamp) return <span className="text-text-muted">—</span>;
        return (
          <span
            className="text-[0.8125em] font-mono tabular-nums text-text-secondary"
            title={new Date(stamp).toLocaleString(locale, { dateStyle: "long", timeStyle: "short" })}
          >
            {formatRelative(stamp, tTime)}
          </span>
        );
      },
    },
    {
      key: "commission_amount",
      label: tTable("commission"),
      sortable: true,
      width: "9em",
      align: "right",
      render: (v, row) => <CommissionCell value={v} row={row} tTable={tTable} />,
    },
  ];
}

function TierCell({ row }) {
  const tier = row.pricing_tier_resolved;
  if (!tier) return <span className="text-text-muted">—</span>;
  const isMulti = (row.campaign?.tier_count ?? 1) > 1;
  if (!isMulti) {
    return (
      <span className="text-[0.8125em] font-mono tabular-nums text-text">{fmtDA(tier.price)} DA</span>
    );
  }
  return (
    <div className="flex flex-col gap-[0.125em] min-w-0">
      <span className="text-[0.8125em] text-text font-medium truncate">{tier.name}</span>
      <span className="text-[0.6875em] font-mono tabular-nums text-text-muted">
        {fmtDA(tier.price)} DA
      </span>
    </div>
  );
}

function CommissionCell({ value, row, tTable }) {
  const showsValue = COMMISSION_VISIBLE_STATUSES.has(row.status);
  if (!showsValue || typeof value !== "number") {
    return <span className="text-text-muted">{tTable("noCommission")}</span>;
  }
  const isFinal = row.status === "converted" || row.status === "converted_verified";
  return (
    <span
      className={cn(
        "font-mono tabular-nums text-[0.8125em]",
        isFinal ? "text-accent font-semibold" : "text-text",
      )}
    >
      {fmtDA(value)} DA
    </span>
  );
}
