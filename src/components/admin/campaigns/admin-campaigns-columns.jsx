"use client";

/**
 * DataTable column config for /admin/campaigns. Extracted from
 * AdminCampaignsPage to keep the page under the project's ~250-line
 * file-size cap. Pure render config — no state. Cell renderers receive
 * the row + a `ctx` bag (t, locale, callbacks) closed over by the page.
 */

import StatusBadge from "@/components/shared/data-display/StatusBadge";
import { MOCK_CATEGORIES } from "@/lib/mock/_seed/categories";

function formatDate(iso, locale) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-DZ" : "en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function categoryName(id, locale) {
  const c = MOCK_CATEGORIES.find((cat) => cat.id === id);
  return c ? (locale === "fr" ? c.name_fr : c.name_en) : "—";
}

export function buildAdminCampaignsColumns({ t, locale }) {
  return [
    {
      key: "product_name",
      label: t("columns.product"),
      width: "22em",
      render: (_, row) => (
        <div className="flex items-center gap-[0.75em] min-w-0">
          {row.product_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.product_image}
              alt={row.product_name}
              className="w-[2.5em] h-[2.5em] rounded-[0.5em] object-cover border border-border-light shrink-0 bg-bg"
            />
          ) : (
            <div className="w-[2.5em] h-[2.5em] rounded-[0.5em] bg-bg-alt shrink-0" />
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-[0.875em] font-medium text-text truncate">
              {row.product_name}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "company_name",
      label: t("columns.company"),
      width: "12em",
      render: (v) => (
        <span className="text-[0.8125em] text-text-secondary truncate">{v ?? "—"}</span>
      ),
    },
    {
      key: "category",
      label: t("columns.category"),
      width: "10em",
      render: (v) => (
        <span className="text-[0.8125em] text-text-secondary">{categoryName(v, locale)}</span>
      ),
    },
    {
      key: "status",
      label: t("columns.status"),
      width: "8em",
      render: (v) => <StatusBadge status={v} label={t(`statuses.${v}`)} />,
    },
    {
      key: "partners_count",
      label: t("columns.partners"),
      width: "6em",
      align: "right",
      render: (v) => (
        <span className="font-mono tabular-nums text-[0.8125em] text-text-secondary">
          {v}
        </span>
      ),
    },
    {
      key: "leads_count",
      label: t("columns.leads"),
      width: "6em",
      align: "right",
      render: (v) => (
        <span className="font-mono tabular-nums text-[0.8125em] text-text-secondary">
          {v}
        </span>
      ),
    },
    {
      key: "created_at",
      label: t("columns.created"),
      width: "8em",
      render: (v) => (
        <span className="text-[0.8125em] text-text-secondary">{formatDate(v, locale)}</span>
      ),
    },
  ];
}
