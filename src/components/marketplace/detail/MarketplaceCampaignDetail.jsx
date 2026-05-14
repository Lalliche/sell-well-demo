"use client";

/**
 * MarketplaceCampaignDetail — /marketplace/[slug] page composition.
 *
 * Layout (lg+):
 *   8/4 split. Left = breadcrumb + hero + content sections. Right = sticky
 *   ApplyRail with pricing tiers + Apply state machine.
 *
 * Layout (below lg):
 *   Stacked single column. ApplyRail flows after the hero, before the
 *   long-tail content sections, so the partner sees pricing + Apply
 *   without a long scroll on mobile.
 *
 * Page-level entrance: element-level micro-stagger (60ms between rows)
 * orchestrated from here. Children consume their `motion` variants from
 * a parent `motion.div` so the rhythm stays in one place.
 *
 * Page wrapper follows the dashboard rule: `px-[2em] py-[2em]` only, no
 * `max-w-* mx-auto` — the DashboardShell content card already owns the
 * page width.
 */

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchMarketplaceCampaignBySlug } from "@/lib/mock/marketplace";
import DetailHero from "./DetailHero";
import ApplyRail from "./ApplyRail";
import DetailContentSections from "./DetailContentSections";
import CompanySummaryCard from "./CompanySummaryCard";
import DetailSkeleton from "./DetailSkeleton";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  },
};

export default function MarketplaceCampaignDetail({ slug }) {
  const t = useTranslations("Marketplace.detail");
  const { user } = useAuth();
  const userId = user?.id;

  const { data: campaign, isLoading, isError } = useQuery({
    queryKey: ["marketplace", "campaign", slug, { userId }],
    queryFn: () => fetchMarketplaceCampaignBySlug(slug, { userId }),
    enabled: !!userId,
  });

  if (isLoading) return <DetailSkeleton />;
  if (isError) {
    return (
      <div className="px-[2em] py-[2em] text-[0.875em] text-text-muted">
        {t("errorBody")}
      </div>
    );
  }
  if (!campaign) notFound();

  return (
    <motion.div
      className="px-[2em] py-[2em] flex flex-col gap-[1.25em]"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={rowVariants}>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-[0.375em] text-[0.8125em] text-text-muted hover:text-text transition-colors duration-150 ease-out"
        >
          <ChevronLeft className="w-[1em] h-[1em]" strokeWidth={1.5} />
          <span>{t("backToMarketplace")}</span>
        </Link>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-[2em] items-start">
        {/* Left column — content */}
        <div className="flex-1 min-w-0 w-full flex flex-col gap-[1.5em]">
          <motion.div variants={rowVariants}>
            <DetailHero campaign={campaign} />
          </motion.div>

          {/* Right rail flows here on mobile (below the hero), then is
              hidden on lg+ where the actual right rail takes over. */}
          <div className="lg:hidden">
            <ApplyRail campaign={campaign} />
          </div>

          <DetailContentSections campaign={campaign} variants={rowVariants} />

          <motion.div variants={rowVariants}>
            <CompanySummaryCard company={campaign.company} />
          </motion.div>
        </div>

        {/* Right column — sticky ApplyRail (lg+ only) */}
        <motion.aside
          variants={rowVariants}
          className="hidden lg:block w-[22em] shrink-0 sticky top-[1.5em]"
        >
          <ApplyRail campaign={campaign} />
        </motion.aside>
      </div>
    </motion.div>
  );
}
