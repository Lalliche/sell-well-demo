"use client";

/**
 * CompanyDetailHero — top of the company-side campaign detail page.
 *
 * Mirrors the partner-side `marketplace/detail/DetailHero` layout (logo +
 * meta + title + tagline + 16:9 cover) so the two roles see a familiar
 * shape, but adds the company-specific bits the partner side never sees:
 *   - StatusBadge inline with the meta row (paused / draft / closed are
 *     load-bearing for the company; the partner only ever lands on
 *     active/paused listings).
 *   - The campaign's `updated_at` timestamp as a small muted line so the
 *     company knows when their last edit landed.
 *
 * No `layoutId` shared element here — the company-side card on
 * `/campaigns` doesn't currently use a layoutId pair (the partner-side
 * marketplace card does, scoped to its own listing).
 */

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import StatusBadge from "@/components/shared/data-display/StatusBadge";

export default function CompanyDetailHero({ campaign }) {
  const t = useTranslations("Campaigns.companyDetail.hero");
  const locale = useLocale();
  const company = campaign.company;
  const category = campaign.category_resolved;
  const categoryLabel = category
    ? (locale === "fr" ? category.name_fr : category.name_en)
    : "";

  // First sentence (or first 160 chars) of the description as a tagline.
  const tagline = (() => {
    const d = campaign.description ?? "";
    const period = d.indexOf(". ");
    if (period > 30 && period < 200) return d.slice(0, period + 1);
    return d.length > 160 ? `${d.slice(0, 157)}…` : d;
  })();

  const updatedLabel = campaign.updated_at
    ? new Date(campaign.updated_at).toLocaleDateString(
        locale === "fr" ? "fr-DZ" : "en-US",
        { day: "numeric", month: "short", year: "numeric" },
      )
    : null;

  return (
    <header className="flex flex-col gap-[1em]">
      {/* Meta row */}
      <div className="flex items-center gap-[0.625em] min-w-0">
        {company?.logo ? (
          <span className="relative shrink-0 w-[2.25em] h-[2.25em] rounded-[0.375em] overflow-hidden bg-bg-alt">
            <Image
              src={company.logo}
              alt={company.company_name}
              fill
              sizes="2.25em"
              className="object-cover"
            />
          </span>
        ) : (
          <span className="shrink-0 w-[2.25em] h-[2.25em] rounded-[0.375em] bg-bg-alt" />
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[0.875em] font-semibold text-text truncate">
            {company?.company_name ?? t("unknownCompany")}
          </span>
          {categoryLabel && (
            <span className="text-[0.6875em] font-semibold tracking-[0.08em] uppercase text-text-muted truncate">
              {categoryLabel}
            </span>
          )}
        </div>
        <StatusBadge status={campaign.status} className="shrink-0" />
      </div>

      {/* Title + tagline */}
      <div className="flex flex-col gap-[0.5em]">
        <h1 className="font-heading text-[2em] font-bold tracking-[-0.02em] text-text leading-[1.15]">
          {campaign.product_name}
        </h1>
        <p className="text-[0.9375em] text-text-secondary leading-[1.55] max-w-[55ch]">
          {tagline}
        </p>
        {updatedLabel && (
          <span className="text-[0.75em] text-text-muted">
            {t("updatedOn", { date: updatedLabel })}
          </span>
        )}
      </div>

      {/* Cover image */}
      {campaign.product_image && (
        <div className="relative w-full aspect-[16/9] rounded-[0.75em] overflow-hidden bg-bg-alt border border-border-light">
          <Image
            src={campaign.product_image}
            alt={campaign.product_name}
            fill
            sizes="(min-width: 1150px) 60vw, 100vw"
            className="object-cover"
            priority
          />
        </div>
      )}
    </header>
  );
}
