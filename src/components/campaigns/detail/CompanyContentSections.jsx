"use client";

/**
 * CompanyContentSections — long-tail content stacked beneath the hero on
 * the company-side campaign detail. Mirrors the partner-side
 * `marketplace/detail/DetailContentSections` structure (About / Pricing /
 * Sales Kit / Audience / Requirements / Tags) but adds the two
 * company-only previews:
 *   - Recent applications (5 rows + deep-link)
 *   - Recent leads (5 rows + deep-link)
 *
 * Each section is a `motion.section` so the parent page-level stagger
 * applies row-by-row. No `whileInView` — pages inside DashboardShell are
 * short enough that everything paints during the entrance animation.
 */

import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { MOCK_PRODUCT_TAGS } from "@/lib/mock/_seed/product-tags";
import SalesKitSection from "@/components/marketplace/detail/SalesKitSection";
import RecentApplicationsPreview from "./RecentApplicationsPreview";
import RecentLeadsPreview from "./RecentLeadsPreview";
import PricingTiersBlock from "./PricingTiersBlock";

const SectionTitle = ({ children }) => (
  <h2 className="font-heading text-[1.125em] font-semibold tracking-[-0.01em] text-text">
    {children}
  </h2>
);

export default function CompanyContentSections({ campaign, variants }) {
  const t = useTranslations("Campaigns.companyDetail.sections");
  const locale = useLocale();

  const productTags = (campaign.product_tags ?? [])
    .map((id) => MOCK_PRODUCT_TAGS.find((tag) => tag.id === id))
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-[1.5em]">
      {/* About */}
      <motion.section variants={variants} className="flex flex-col gap-[0.625em]">
        <SectionTitle>{t("about")}</SectionTitle>
        <p className="text-[0.9375em] text-text-secondary leading-[1.65] max-w-[65ch] whitespace-pre-wrap">
          {campaign.description}
        </p>
      </motion.section>

      {/* Pricing tiers */}
      <motion.section variants={variants}>
        <PricingTiersBlock campaign={campaign} />
      </motion.section>

      {/* Recent applications preview */}
      <motion.section variants={variants}>
        <RecentApplicationsPreview campaign={campaign} />
      </motion.section>

      {/* Recent leads preview */}
      <motion.section variants={variants}>
        <RecentLeadsPreview campaign={campaign} />
      </motion.section>

      {/* Sales Kit — between operational previews and audience/tags so the
          Edit-relevant content groups together near the bottom. */}
      <motion.div variants={variants}>
        <SalesKitSection documents={campaign.documents} variants={variants} />
      </motion.div>

      {/* Who this is for */}
      {(campaign.target_description || campaign.target_company_size?.length) && (
        <motion.section variants={variants} className="flex flex-col gap-[0.625em]">
          <SectionTitle>{t("targetAudience")}</SectionTitle>
          {campaign.target_description && (
            <p className="text-[0.9375em] text-text-secondary leading-[1.65] max-w-[65ch]">
              {campaign.target_description}
            </p>
          )}
          {campaign.target_company_size?.length > 0 && (
            <div className="flex flex-wrap gap-[0.375em] pt-[0.25em]">
              {campaign.target_company_size.map((size) => (
                <span
                  key={size}
                  className="font-mono text-[0.75em] px-[0.625em] py-[0.25em] rounded-[0.375em] bg-bg-alt text-text-secondary"
                >
                  {t("companySize", { range: size })}
                </span>
              ))}
            </div>
          )}
        </motion.section>
      )}

      {/* Requirements */}
      {campaign.requirements && (
        <motion.section variants={variants} className="flex flex-col gap-[0.625em]">
          <SectionTitle>{t("requirements")}</SectionTitle>
          <p className="text-[0.9375em] text-text-secondary leading-[1.65] max-w-[65ch] whitespace-pre-wrap">
            {campaign.requirements}
          </p>
        </motion.section>
      )}

      {/* Product tags */}
      {productTags.length > 0 && (
        <motion.section variants={variants} className="flex flex-col gap-[0.625em]">
          <SectionTitle>{t("tags")}</SectionTitle>
          <div className="flex flex-wrap gap-[0.375em]">
            {productTags.map((tag) => (
              <span
                key={tag.id}
                className="text-[0.75em] px-[0.625em] py-[0.25em] rounded-[0.375em] bg-accent-light text-accent-text font-medium"
              >
                {locale === "fr" ? tag.name_fr : tag.name_en}
              </span>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
