"use client";

/**
 * CompanyCampaignDetail — /campaigns/[slug] page composition (Phase 7.4).
 *
 * Layout (lg+):
 *   8/4 split. Left = breadcrumb + hero + content sections. Right =
 *   sticky ManageRail (commission headline + KPI grid + action stack +
 *   meta).
 *
 * Layout (below lg):
 *   Stacked single column. ManageRail flows after the hero so the
 *   company sees the action stack + KPIs before scrolling through the
 *   long-tail content.
 *
 * Page-level entrance: element-level micro-stagger (60ms between rows)
 * orchestrated from this parent — children consume the `rowVariants`
 * directly so the entrance feels coherent across the page.
 *
 * Page wrapper follows the dashboard rule: `px-[2em] py-[2em]` only, no
 * `max-w-* mx-auto` — the DashboardShell content card already owns the
 * page width.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchCampaignBySlug } from "@/lib/mock/campaigns";
import DetailSkeleton from "@/components/marketplace/detail/DetailSkeleton";
import CompanyDetailHero from "./CompanyDetailHero";
import CompanyContentSections from "./CompanyContentSections";
import ManageRail from "./ManageRail";
import CampaignEditOverlay from "./CampaignEditOverlay";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  },
};

export default function CompanyCampaignDetail({ slug }) {
  const t = useTranslations("Campaigns.companyDetail");
  const { user, ready } = useAuth();
  // CompanyProfile.id, NOT User.id — the mock layer scopes campaigns by
  // CompanyProfile (campaign.company FK). Using user.id would 404 every
  // campaign because the user PK and the company-profile PK differ.
  const companyId = user?.role === "company" ? (user.profile?.id ?? user?.id) : null;
  const enabled = ready && !!user && (user.role !== "company" || !!companyId);
  const [editOpen, setEditOpen] = useState(false);

  const { data: campaign, isFetched, isError } = useQuery({
    queryKey: ["campaign", slug, { companyId }],
    queryFn: () => fetchCampaignBySlug(slug, { companyId }),
    enabled,
  });

  // Verification gate — pause/resume/close disabled while company is
  // pending review or has an unverified email. Edit stays clickable.
  const actionsDisabled =
    user?.role === "company" &&
    (user?.application_status !== "approved" || user?.is_email_verified === false);

  // Render skeleton while auth is hydrating OR the query hasn't fetched
  // yet. `isFetched` flips true only after the queryFn resolves; checking
  // it (instead of `isLoading`) prevents notFound() from firing during
  // the SSR pass when `enabled` is false and `data` is still undefined.
  if (!enabled || !isFetched) return <DetailSkeleton />;
  if (isError) {
    return (
      <div className="px-[2em] py-[2em] text-[0.875em] text-text-muted">
        {t("errorBody")}
      </div>
    );
  }
  if (!campaign) notFound();

  return (
    <>
      <motion.div
        className="px-[2em] py-[2em] flex flex-col gap-[1.25em]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={rowVariants}>
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-[0.375em] text-[0.8125em] text-text-muted hover:text-text transition-colors duration-150 ease-out"
          >
            <ChevronLeft className="w-[1em] h-[1em]" strokeWidth={1.5} />
            <span>{t("backToCampaigns")}</span>
          </Link>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-[2em] items-start">
          {/* Left column — content */}
          <div className="flex-1 min-w-0 w-full flex flex-col gap-[1.5em]">
            <motion.div variants={rowVariants}>
              <CompanyDetailHero campaign={campaign} />
            </motion.div>

            {/* Below-lg the rail stacks here so the company sees the
                action stack + KPIs before scrolling through long-tail
                content. lg+ swaps it for the sticky aside. */}
            <div className="lg:hidden">
              <ManageRail
                campaign={campaign}
                actionsDisabled={actionsDisabled}
                onEditClick={() => setEditOpen(true)}
              />
            </div>

            <CompanyContentSections campaign={campaign} variants={rowVariants} />
          </div>

          {/* Right column — sticky ManageRail (lg+ only) */}
          <motion.aside
            variants={rowVariants}
            className="hidden lg:block w-[22em] shrink-0 sticky top-[1.5em]"
          >
            <ManageRail
              campaign={campaign}
              actionsDisabled={actionsDisabled}
              onEditClick={() => setEditOpen(true)}
            />
          </motion.aside>
        </div>
      </motion.div>

      {/* Edit overlay — mounted lazily; stays unmounted until first open
          so the form state doesn't initialize on every page render.
          Re-mounted with a fresh form each time we re-open via the
          `key` prop tied to `editOpen`. */}
      {editOpen && (
        <CampaignEditOverlay
          key={`edit-${campaign.id}-${campaign.updated_at}`}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          campaign={campaign}
        />
      )}
    </>
  );
}
