"use client";

/**
 * CompanySummaryCard — bottom of the detail page. Quiet card showing who's
 * behind the campaign. Surfaces logo, company name, industry, and the
 * website link if available. Description is intentionally omitted — the
 * card slice from `fetchMarketplaceCampaignBySlug` doesn't include it, and
 * the partner is here for the campaign, not the company bio. We can wire
 * the full CompanyProfile detail page in a later phase.
 */

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import { MOCK_COMPANY_PROFILES } from "@/lib/mock/_seed/company-profiles";
import { MOCK_CATEGORIES } from "@/lib/mock/_seed/categories";

export default function CompanySummaryCard({ company }) {
  const t = useTranslations("Marketplace.detail.company");
  const locale = useLocale();

  if (!company) return null;

  // Pull the full profile so we can show description + website. The slice
  // on the campaign-detail wire is intentionally light.
  const full = MOCK_COMPANY_PROFILES.find((c) => c.id === company.id);
  if (!full) return null;

  const industry = MOCK_CATEGORIES.find((c) => c.id === full.industry);
  const industryLabel = industry
    ? (locale === "fr" ? industry.name_fr : industry.name_en)
    : null;

  return (
    <section className="flex flex-col gap-[1em] p-[1.25em] bg-surface border border-border-light rounded-[0.75em]">
      <div className="flex items-start gap-[0.875em]">
        {full.logo ? (
          <span className="relative shrink-0 w-[3em] h-[3em] rounded-[0.5em] overflow-hidden bg-bg-alt">
            <Image
              src={full.logo}
              alt={full.company_name}
              fill
              sizes="3em"
              className="object-cover"
            />
          </span>
        ) : (
          <span className="shrink-0 w-[3em] h-[3em] rounded-[0.5em] bg-bg-alt" />
        )}
        <div className="flex flex-col min-w-0 gap-[0.125em]">
          <span className="text-[0.6875em] font-semibold tracking-[0.08em] uppercase text-text-muted">
            {t("aboutCompany")}
          </span>
          <span className="text-[1em] font-semibold text-text">
            {full.company_name}
          </span>
          {industryLabel && (
            <span className="text-[0.8125em] text-text-muted">
              {industryLabel}
            </span>
          )}
        </div>
      </div>

      {full.description && (
        <p className="text-[0.875em] text-text-secondary leading-[1.6] max-w-[65ch]">
          {full.description}
        </p>
      )}

      {full.website && (
        <a
          href={full.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-[0.375em] text-[0.8125em] font-medium text-accent-text hover:text-accent transition-colors duration-150 ease-out self-start"
        >
          <span>{t("visitWebsite")}</span>
          <ExternalLink className="w-[0.875em] h-[0.875em]" strokeWidth={1.5} />
        </a>
      )}
    </section>
  );
}
