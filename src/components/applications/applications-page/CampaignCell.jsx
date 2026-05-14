"use client";

/** Campaign cell for the /applications table — logo + product + company-and-category overline. */
export default function CampaignCell({ row, locale, fallback }) {
  const campaign = row.campaign;
  const company = campaign.company;
  const category = campaign.category_resolved;
  const categoryName = category ? (locale === "fr" ? category.name_fr : category.name_en) : null;

  return (
    <div className="flex items-center gap-[0.625em] min-w-0">
      {company?.logo ? (
        <span className="inline-flex w-[2em] h-[2em] rounded-[0.375em] overflow-hidden bg-bg shrink-0 border border-border-light">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={company.logo} alt={company.company_name} className="w-full h-full object-cover" />
        </span>
      ) : (
        <span className="inline-flex w-[2em] h-[2em] rounded-[0.375em] bg-bg-alt shrink-0" />
      )}
      <div className="flex flex-col gap-[0.125em] min-w-0">
        <span className="text-[0.875em] font-semibold text-text truncate">
          {campaign.product_name}
        </span>
        <span className="text-[0.6875em] text-text-muted truncate font-body">
          {company?.company_name ?? fallback}
          {categoryName ? ` · ${categoryName}` : ""}
        </span>
      </div>
    </div>
  );
}
