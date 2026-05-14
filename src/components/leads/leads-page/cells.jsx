"use client";

/**
 * Table cell components for /leads — Client and Campaign cells.
 * Pure presentation, no data fetching. Lives next to the column factory
 * so the page orchestrator stays focused on data + composition.
 */

export function ClientCell({ row }) {
  return (
    <div className="flex flex-col gap-[0.125em] min-w-0">
      <span className="text-[0.875em] font-semibold text-text truncate">
        {row.client_full_name}
      </span>
      {row.client_company_name && (
        <span className="text-[0.6875em] text-text-muted truncate font-body">
          {row.client_company_name}
        </span>
      )}
    </div>
  );
}

export function CampaignCell({ row, locale }) {
  const campaign = row.campaign;
  const company = campaign.company;
  const category = campaign.category_resolved;
  const categoryName = category ? (locale === "fr" ? category.name_fr : category.name_en) : null;
  return (
    <div className="flex items-center gap-[0.5em] min-w-0">
      {company?.logo ? (
        <span className="inline-flex w-[1.75em] h-[1.75em] rounded-[0.375em] overflow-hidden bg-bg shrink-0 border border-border-light">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={company.logo} alt={company.company_name} className="w-full h-full object-cover" />
        </span>
      ) : (
        <span className="inline-flex w-[1.75em] h-[1.75em] rounded-[0.375em] bg-bg-alt shrink-0" />
      )}
      <div className="flex flex-col gap-[0.125em] min-w-0">
        <span className="text-[0.8125em] font-semibold text-text truncate">
          {campaign.product_name}
        </span>
        <span className="text-[0.6875em] text-text-muted truncate font-body">
          {company?.company_name}
          {categoryName ? ` · ${categoryName}` : ""}
        </span>
      </div>
    </div>
  );
}
