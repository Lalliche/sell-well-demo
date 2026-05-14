"use client";

/**
 * DetailHero — top of the campaign detail page.
 *
 * Stack:
 *   1. Inline meta row: company logo + company name + category overline
 *   2. Title (Sora h1) + 1-line tagline (truncated description first sentence)
 *   3. 16:9 cover image, full-width within the left column, rounded-lg.
 *
 * The company logo carries `layoutId` keyed to the listing card's logo, so
 * navigation from /marketplace → /marketplace/[slug] morphs the logo
 * smoothly across pages (Framer Motion shared-element pattern).
 */

import Image from "next/image";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";

export default function DetailHero({ campaign }) {
  const t = useTranslations("Marketplace.detail");
  const locale = useLocale();
  const company = campaign.company;
  const category = campaign.category_resolved;
  const categoryLabel = category
    ? (locale === "fr" ? category.name_fr : category.name_en)
    : "";

  // First sentence (or first 140 chars) of description, used as a tagline.
  const tagline = (() => {
    const d = campaign.description ?? "";
    const period = d.indexOf(". ");
    if (period > 30 && period < 200) return d.slice(0, period + 1);
    return d.length > 160 ? `${d.slice(0, 157)}…` : d;
  })();

  return (
    <header className="flex flex-col gap-[1em]">
      {/* Meta row */}
      <div className="flex items-center gap-[0.625em] min-w-0">
        {company?.logo ? (
          <motion.span
            layoutId={`marketplace-card-logo-${campaign.id}`}
            className="relative shrink-0 w-[2.25em] h-[2.25em] rounded-[0.375em] overflow-hidden bg-bg-alt"
          >
            <Image
              src={company.logo}
              alt={company.company_name}
              fill
              sizes="2.25em"
              className="object-cover"
            />
          </motion.span>
        ) : (
          <span className="shrink-0 w-[2.25em] h-[2.25em] rounded-[0.375em] bg-bg-alt" />
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-[0.875em] font-semibold text-text truncate">
            {company?.company_name ?? t("unknownCompany")}
          </span>
          {categoryLabel && (
            <span className="text-[0.6875em] font-semibold tracking-[0.08em] uppercase text-text-muted truncate">
              {categoryLabel}
            </span>
          )}
        </div>
      </div>

      {/* Title + tagline */}
      <div className="flex flex-col gap-[0.5em]">
        <h1 className="font-heading text-[2em] font-bold tracking-[-0.02em] text-text leading-[1.15]">
          {campaign.product_name}
        </h1>
        <p className="text-[0.9375em] text-text-secondary leading-[1.55] max-w-[55ch]">
          {tagline}
        </p>
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
