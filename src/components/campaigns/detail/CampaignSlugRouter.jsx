"use client";

/**
 * CampaignSlugRouter — role branch for /campaigns/[slug].
 *
 * Companies see CompanyCampaignDetail (this is their internal management
 * view). Partners landing here are redirected to /marketplace/[slug],
 * which is the same campaign rendered for the partner buyer perspective
 * (per the slug-routing rule: same Campaign.slug, two role-shaped views).
 *
 * Admins land on a placeholder forwarding screen — the admin queue
 * (Phase 9) will own the admin-facing campaign view.
 */

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import CompanyCampaignDetail from "./CompanyCampaignDetail";
import DetailSkeleton from "@/components/marketplace/detail/DetailSkeleton";

export default function CampaignSlugRouter({ slug }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useTranslations("Campaigns.companyDetail.adminForward");

  // Partners get hard-routed to /marketplace/[slug] — that's the same
  // campaign rendered for their role. Done as a router.replace inside
  // an effect so the initial render doesn't paint the wrong shell.
  useEffect(() => {
    if (!ready) return;
    if (user?.role === "sales_partner") {
      router.replace(`/marketplace/${slug}`);
    }
  }, [ready, user?.role, slug, router]);

  if (!ready) return <DetailSkeleton />;
  if (!user) return null;

  if (user.role === "company") return <CompanyCampaignDetail slug={slug} />;

  // Sales partner branch — render skeleton while the redirect lands so
  // the user never sees a flash of "wrong-page" content.
  if (user.role === "sales_partner") return <DetailSkeleton />;

  // Admin branch — minimal forwarder. The admin panel (Phase 9) will own
  // the admin-facing campaign view; we don't fake one here.
  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[1em]">
      <p className="text-[0.9375em] text-text font-semibold">{t("title")}</p>
      <p className="text-[0.875em] text-text-secondary max-w-[55ch]">
        {t("body")}
      </p>
      <Link
        href="/admin"
        className="self-start inline-flex items-center h-[2.5em] px-[1.125em] rounded-[0.5em] bg-cta text-cta-text text-[0.8125em] font-semibold shadow-sm hover:bg-cta-hover transition-[background-color,box-shadow] duration-150 ease-out"
      >
        {t("cta")}
      </Link>
    </div>
  );
}
