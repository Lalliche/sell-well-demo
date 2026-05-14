"use client";

/**
 * DetailContentSections — long-tail content beneath the hero.
 *
 * Sections, in order (each rendered conditionally — campaigns may not have
 * all of them):
 *   - About this campaign         (campaign.description, full text)
 *   - Who this is for             (target_description + target_company_size)
 *   - Requirements                (campaign.requirements)
 *   - Tags                        (product_tags)
 *
 * Each section is `motion.section` consuming the page-level `rowVariants`
 * passed from the parent so the entrance stagger stays consistent. No
 * `whileInView` — the page is short enough that everything paints during
 * the entrance.
 */

import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { MOCK_PRODUCT_TAGS } from "@/lib/mock/_seed/product-tags";
import SalesKitSection from "./SalesKitSection";

const SectionTitle = ({ children }) => (
  <h2 className="font-heading text-[1.125em] font-semibold tracking-[-0.01em] text-text">
    {children}
  </h2>
);

export default function DetailContentSections({ campaign, variants }) {
  const t = useTranslations("Marketplace.detail.sections");
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

      {/* Sales Kit — between About and Who this is for */}
      <SalesKitSection documents={campaign.documents} variants={variants} />

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
